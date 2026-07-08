"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { eventTypes, getEventTypeLabel } from "@/lib/typeLabels";
import {
  usagePlaces,
  getUsagePlaceLabel,
  getUsagePlaceColor,
} from "@/lib/usagePlaces";
import { getSportType } from "@/lib/sportTypes";

type Event = {
  id: string;
  description?: string | null;
  event_date?: string | null;
  date?: string | null;
  due_date?: string | null;
  reminder_date?: string | null;
  reminder_text?: string | null;
  maintenance_type?: string | null;
  company?: string | null;
  usage_place?: string | null;

  // 🔥 LISÄÄ NÄMÄ
  start_time?: string | null;
  source_type?: string | null;
  sport_activity_id?: string | null;
  title?: string | null;

  sport_activities?: any;
  
};

type CalendarEntry = {
  event: Event;
  kind: "event" | "reminder";
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);


  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*, sport_activities(*)")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Calendar fetch error:", error);
      return;
    }

    setEvents(data || []);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("fi-FI", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;

    const result: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) result.push(null);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      result.push(new Date(year, month, day));
    }

    return result;
  }, [year, month]);

  function getEventDate(event: Event) {
  return (
    event.event_date ||
    (event.start_time
      ? new Date(event.start_time).toISOString().slice(0, 10)
      : null)
  );
}

  function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function togglePlace(place: string) {
    setSelectedPlaces((prev) =>
      prev.includes(place)
        ? prev.filter((item) => item !== place)
        : [...prev, place]
    );
  }


  function entriesForDay(date: Date): CalendarEntry[] {
  const dateString = toDateString(date);

  return events.flatMap((event) => {
    const placeKey =
      event.source_type === "sport"
        ? "liikunta"
        : event.usage_place || "muu";

    if (
      selectedPlaces.length > 0 &&
      !selectedPlaces.includes(placeKey)
    ) {
      return [];
    }

    const entries: CalendarEntry[] = [];

    const eventDate = getEventDate(event);

    if (eventDate === dateString) {
      entries.push({ event, kind: "event" });
    }

    if (event.reminder_date === dateString) {
      entries.push({ event, kind: "reminder" });
    }

    return entries;
  });
}

  function isToday(date: Date) {
    const today = new Date();
    return toDateString(date) === toDateString(today);
  }

  function getEntryStyle(
  kind: "event" | "reminder",
  maintenanceType?: string | null,
  sourceType?: string | null
) {
  // 🔥 SPORT
  if (sourceType === "sport") {
  return {
    background: "#dcfce7",
    border: "1px solid #22c55e",
  };
}

  if (kind === "reminder") {
    return {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
    };
  }

  return {
    background:
      eventTypes[maintenanceType as keyof typeof eventTypes]?.color ??
      eventTypes.muu.color,
    border: "1px solid #ddd",
  };
}

  function getEntryText(entry: CalendarEntry) {
  const { event, kind } = entry;

  // 🔥 SPORT EVENT
  if (event.source_type === "sport") {
  const activity = (event as any).sport_activities;

  const sport = getSportType(
    activity?.activity_sub_type || activity?.activity_type
  );

  return (
    <>
      {/* 🟢 LAJI */}
      <div style={{ fontWeight: 600 }}>
        {sport.emoji} {sport.label}
      </div>

      {/* 🟢 OTSIKKO */}
      {activity?.title && (
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          {activity.title}
        </div>
      )}

      {/* 🟢 STATS (SAMA KUIN SPORTS-SIVU) */}
      <div style={{ fontSize: 11, opacity: 0.7 }}>
        {activity?.distance_meters
          ? `${(activity.distance_meters / 1000).toFixed(1)} km`
          : ""}

        {activity?.duration_seconds
          ? ` · ${formatDuration(activity.duration_seconds)}`
          : ""}

        {activity?.calories
          ? ` · ${activity.calories} kcal`
          : ""}
      </div>
    </>
  );
}

  if (kind === "reminder") {
    return (
      <>
        <span>{event.reminder_text || "Ei muistutustekstiä"}</span>
      </>
    );
  }

  return event.description || event.company || "Ei kuvausta";
}


  return (
    <main
      style={{
    width: "100%",
    maxWidth: "100%",
        background: "#0f0f0f",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>📅 Kalenteri</h1>
        <Link href="/events/new">➕ Lisää tapahtuma</Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button onClick={() => setCurrentDate(new Date())}>📅 Tänään</button>

        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
          ←
        </button>

        <h2
          style={{
            minWidth: 185,
            textAlign: "center",
            textTransform: "capitalize",
          }}
        >
          {monthName}
        </h2>

        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
          →
        </button>
      </div>

      <section
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 14,
          background: "#181818",
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Käyttöpaikka</div>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

  {/* 🔥 NORMAALIT KÄYTTÖPAIKAT */}
  {Object.entries(usagePlaces)
  .filter(([key]) => key !== "liikunta")
  .map(([key, value]) => {
    const selected = selectedPlaces.includes(key);

    return (
      <label
        key={key}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 10px",
          borderRadius: 999,
          border: selected ? "1px solid #93c5fd" : "1px solid #444",
          background: selected ? "#1f2937" : "#111",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => togglePlace(key)}
        />

        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: getUsagePlaceColor(key),
          }}
        />

        <span>{value.label}</span>
      </label>
    );
  })}

  {/* 🔥 LIIKUNTA SAMAAN RIVIIN */}
  {(() => {
    const selected = selectedPlaces.includes("liikunta");

    return (
      <label
        key="liikunta"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 10px",
          borderRadius: 999,
          border: selected ? "1px solid #86efac" : "1px solid #444",
          background: selected ? "#052e16" : "#111",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => togglePlace("liikunta")}
        />

        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />

        <span>🏃 Liikunta</span>
      </label>
    );
  })()}

</div>

        {selectedPlaces.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedPlaces([])}
            style={{ marginTop: 12 }}
          >
            Tyhjennä käyttöpaikkasuodatin
          </button>
        )}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedEntry ? "1fr 320px" : "1fr",
          gap: 24,
          marginTop: 20,
        }}
      >
        <section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
              gap: 6,
              fontWeight: "bold",
            }}
          >
            {["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 8,
    width: "100%",
  }}
>
            {days.map((day, index) => {
              const dayEntries = day ? entriesForDay(day) : [];

              return (
                <div
                  key={index}
                  style={{
                    minHeight: 120,
                    width: "100%",
                    borderRadius: 8,
                    padding: 8,
                    background: day
                      ? isToday(day)
                        ? "#f5f3ff"
                        : "white"
                      : "#f5f5f5",
                    border:
                      day && isToday(day)
                        ? "2px solid #7c3aed"
                        : "1px solid #ddd",
                  }}
                >
                  {day && (
                    <>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isToday(day) ? "#7c3aed" : "transparent",
                          color: isToday(day) ? "white" : "#111",
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        {day.getDate()}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        {dayEntries.map(({ event, kind }) => (
                          <button
                            key={`${event.id}-${kind}`}
                            onClick={() => {
  if (event.source_type === "sport") {
    window.location.href = `/sports?id=${event.sport_activity_id}`;
  } else {
    setSelectedEntry({ event, kind });
  }
}}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              marginBottom: 6,
                              padding: 6,
                              borderRadius: 6,
                              color: "#111",
                              fontSize: 13,
                              cursor: "pointer",
                              whiteSpace: "normal",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              lineHeight: 1.25,
                              ...getEntryStyle(
  kind,
  event.maintenance_type,
  event.source_type
),
                            }}
                          >
                            {event.source_type === "sport" ? (
  getEntryText({ event, kind })
) : (
  <>
    <strong>
      {kind === "reminder" ? "🔔 Muistutus: " : ""}
      {getEventTypeLabel(event.maintenance_type)}
    </strong>
    <br />
    {getEntryText({ event, kind })}
  </>
)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {selectedEntry && (
          <aside
            style={{
              padding: 18,
              borderRadius: 12,
              background:
                selectedEntry.kind === "reminder"
                  ? "#fff7ed"
                  : getEntryStyle(
                      selectedEntry.kind,
                      selectedEntry.event.maintenance_type
                    ).background,
              border:
                selectedEntry.kind === "reminder"
                  ? "1px solid #fed7aa"
                  : getEntryStyle(
                      selectedEntry.kind,
                      selectedEntry.event.maintenance_type
                    ).border,
              color: "#111",
              height: "fit-content",
              boxShadow: "0 4px 12px rgba(0,0,0,.15)",
            }}
          >
            <button
              onClick={() => setSelectedEntry(null)}
              style={{
                float: "right",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: "#555",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              ✕
            </button>

            <h2>
  {selectedEntry.kind === "reminder"
    ? "🔔 Muistutus"
    : selectedEntry.event.source_type === "sport"
    ? "🏃 Urheilusuoritus"
    : "📌 Tapahtuma"}
</h2>

{selectedEntry.event.source_type === "sport" && (
  <>
    <p>
      <strong>Suoritus:</strong>{" "}
      {selectedEntry.event.title}
    </p>

    <p>
      <strong>Tiedot:</strong>{" "}
      {selectedEntry.event.description}
    </p>
  </>
)}

            <p>
              <strong>Tyyppi:</strong>{" "}
              {getEventTypeLabel(selectedEntry.event.maintenance_type)}
            </p>

            <p>
              <strong>Käyttöpaikka:</strong>{" "}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: getUsagePlaceColor(
                      selectedEntry.event.usage_place
                    ),
                    display: "inline-block",
                  }}
                />
                {getUsagePlaceLabel(selectedEntry.event.usage_place)}
              </span>
            </p>

            <p>
              <strong>
                {selectedEntry.kind === "reminder" ? "Muistutus:" : "Kuvaus:"}
              </strong>{" "}
              {getEntryText(selectedEntry)}
            </p>

            <p>
              <strong>Yritys:</strong>{" "}
              {selectedEntry.event.company || "Ei yritystä"}
            </p>

            <p>
              <strong>Tapahtumapäivä:</strong>{" "}
              {selectedEntry.event.event_date || selectedEntry.event.date || "-"}
            </p>

            <p>
              <strong>Muistutuspäivä:</strong>{" "}
              {selectedEntry.event.reminder_date || "-"}
            </p>

            <Link
              href={`/events/${selectedEntry.event.id}`}
              style={{
                display: "inline-block",
                marginTop: 16,
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Avaa tapahtuma →
            </Link>
          </aside>
        )}
      </div>

      <p style={{ marginTop: 20 }}>
        <Link href="/events">← Takaisin tapahtumiin</Link>
      </p>
    </main>
  );
}
function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h === 0) {
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}