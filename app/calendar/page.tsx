"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { typeLabels } from "@/lib/typeLabels";

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
};

type CalendarEntry = {
  event: Event;
  kind: "event" | "reminder";
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Calendar fetch error:", error);
        return;
      }

      setEvents(data || []);
    }

    fetchEvents();
  }, []);

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

  function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function entriesForDay(date: Date): CalendarEntry[] {
    const dateString = toDateString(date);

    return events.flatMap((event) => {
      const entries: CalendarEntry[] = [];

      if (event.event_date === dateString) {
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

  function getEntryStyle(kind: "event" | "reminder", maintenanceType?: string | null) {
    if (kind === "reminder") {
      return {
        background: "#fff7ed",
        border: "1px solid #fed7aa",
      };
    }

    switch (maintenanceType) {
      case "huolto":
        return { background: "#eef2ff", border: "1px solid #c7d2fe" };
      case "tarkastus":
        return { background: "#ecfdf5", border: "1px solid #bbf7d0" };
      case "korjaus":
        return { background: "#f5f3ff", border: "1px solid #ddd6fe" };
      case "asennus":
        return { background: "#ecfeff", border: "1px solid #a5f3fc" };
      default:
        return { background: "#f8fafc", border: "1px solid #e2e8f0" };
    }
  }

  function getEntryText(entry: CalendarEntry) {
    const { event, kind } = entry;

    if (kind === "reminder") {
      return (
        <>
          <span>{event.reminder_text || "Ei muistutustekstiä"}</span>

          {event.description && (
            <>
              <br />
              <span style={{ opacity: 0.7 }}>
                {event.description}
              </span>
            </>
          )}
        </>
      );
    }

    return event.description || event.company || "Ei kuvausta";
  }

  return (
    <main style={{ padding: 24 }}>
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
            minWidth: 180,
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
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
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
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
              marginTop: 8,
            }}
          >
            {days.map((day, index) => {
              const dayEntries = day ? entriesForDay(day) : [];

              return (
                <div
                  key={index}
                  style={{
                    minHeight: 120,
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
                            onClick={() => setSelectedEntry({ event, kind })}
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
                              ...getEntryStyle(kind, event.maintenance_type),
                            }}
                          >
                            <strong>
                              {kind === "reminder" ? "🔔 Muistutus: " : ""}
                              {typeLabels[event.maintenance_type || ""] ||
                                event.maintenance_type ||
                                "Tapahtuma"}
                            </strong>
                            <br />
                            {getEntryText({ event, kind })}
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
                : "📌 Tapahtuma"}
            </h2>

            <p>
              <strong>Tyyppi:</strong>{" "}
              {typeLabels[selectedEntry.event.maintenance_type || ""] ||
                selectedEntry.event.maintenance_type ||
                "Ei tyyppiä"}
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