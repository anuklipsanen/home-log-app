"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { eventTypes } from "@/lib/typeLabels";

type Event = {
  id: string;
  description?: string | null;
  event_date?: string | null;
  reminder_date?: string | null;
  reminder_text?: string | null;
  maintenance_type?: string | null;
  company?: string | null;
  usage_place?: string | null;

  start_time?: string | null;
  source_type?: string | null;
  sport_activity_id?: string | null;
  title?: string | null;
};

type CalendarEntry = {
  event: Event;
  kind: "event" | "reminder";
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] =
    useState<CalendarEntry | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [showSports, setShowSports] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setEvents(data || []);
  }

  /* ---------------- DATE HELPERS ---------------- */

  function toDateString(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  function getEventDate(event: Event) {
    return (
      event.event_date ||
      (event.start_time
        ? new Date(event.start_time).toISOString().slice(0, 10)
        : null)
    );
  }

  /* ---------------- FILTER ---------------- */

  function entriesForDay(date: Date): CalendarEntry[] {
    const dateString = toDateString(date);

    return events.flatMap((event) => {
      // sport filter
      if (event.source_type === "sport" && !showSports) {
        return [];
      }

      // paikka filter
      if (
        event.source_type !== "sport" &&
        selectedPlaces.length > 0 &&
        !selectedPlaces.includes(event.usage_place || "muu")
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

  /* ---------------- GRID ---------------- */

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = (first.getDay() + 6) % 7;

    const arr: (Date | null)[] = [];

    for (let i = 0; i < offset; i++) arr.push(null);

    for (let d = 1; d <= last.getDate(); d++) {
      arr.push(new Date(year, month, d));
    }

    return arr;
  }, [year, month]);

  /* ---------------- UI ---------------- */

  function getEntryStyle(entry: CalendarEntry) {
    const { event, kind } = entry;

    if (event.source_type === "sport") {
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
        eventTypes[event.maintenance_type as keyof typeof eventTypes]
          ?.color ?? eventTypes.muu.color,
      border: "1px solid #ddd",
    };
  }

  function getEntryText(entry: CalendarEntry) {
    const { event, kind } = entry;

    if (event.source_type === "sport") {
      return event.title || "Urheilusuoritus";
    }

    if (kind === "reminder") {
      return event.reminder_text || "Muistutus";
    }

    return event.description || event.company || "-";
  }

  /* ---------------- RENDER ---------------- */

  return (
    <main
  style={{
    width: "100%",
    maxWidth: "100%",
  }}
>
      <h1>📅 Kalenteri</h1>

      {/* FILTER */}
      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={showSports}
            onChange={() => setShowSports(!showSports)}
          />
          🏃 Liikunta
        </label>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
          width: "100%",
        }}
      >
        {days.map((day, i) => {
          const entries = day ? entriesForDay(day) : [];

          return (
            <div key={i} style={{ minHeight: 120, background: "#fff" }}>
              {day && (
                <>
                  <strong>{day.getDate()}</strong>

                  {entries.map((entry) => {
                    const isSport =
                      entry.event.source_type === "sport";

                    return (
                      <button
                        key={entry.event.id + entry.kind}
                        onClick={() =>
                          !isSport && setSelectedEntry(entry)
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: 6,
                          padding: 6,
                          borderRadius: 6,
                          textAlign: "left",
                          ...getEntryStyle(entry),
                        }}
                      >
                        {isSport ? (
                          <Link
                            href={`/sports?id=${entry.event.sport_activity_id}`}
                            style={{
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            {getEntryText(entry)}
                          </Link>
                        ) : (
                          getEntryText(entry)
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* DETAIL (vain kotitapahtumille) */}
      {selectedEntry && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setSelectedEntry(null)}>
            Sulje
          </button>

          <h2>📌 Tapahtuma</h2>

          <p>
            <strong>Otsikko:</strong>{" "}
            {selectedEntry.event.description ||
              selectedEntry.event.company}
          </p>

          <p>
            <strong>Päivä:</strong>{" "}
            {getEventDate(selectedEntry.event)}
          </p>
        </div>
      )}
    </main>
  );
}