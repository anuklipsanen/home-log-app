"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getEventTypeLabel, getEventTypeColor } from "@/lib/typeLabels";
import { parseAmount, formatEuro } from "@/lib/costUtils";
import { usagePlaces } from "@/lib/usagePlaces";
import Card from "@/components/Card";

type Event = {
  id: string;
  description?: string | null;
  event_date?: string | null;
  reminder_date?: string | null;
  reminder_text?: string | null;
  company?: string | null;
  maintenance_type?: string | null;
  total_amount?: string | number | null;
  usage_place?: string | null;
};

type CostItem = {
  type: string;
  label: string;
  total: number;
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [openCostType, setOpenCostType] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setEvents(data || []);
    }

    fetchEvents();
  }, []);

  function togglePlace(place: string) {
    setSelectedPlaces((prev) =>
      prev.includes(place)
        ? prev.filter((p) => p !== place)
        : [...prev, place]
    );
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fi-FI");
  }

  function eventType(event: Event) {
    return getEventTypeLabel(event.maintenance_type);
  }

  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);

  const threeWeeksAhead = new Date();
  threeWeeksAhead.setDate(today.getDate() + 21);
  const threeWeeksAheadString = threeWeeksAhead.toISOString().slice(0, 10);

  const recentEvents = events.slice(0, 5);

  const upcomingItems = events.filter(
    (e) =>
      (e.event_date && e.event_date > todayString) ||
      (e.reminder_date && e.reminder_date >= todayString)
  );

  return (
    <main>
      <h1>🏠 Kotiapplikaatio</h1>

      <div className="home-grid">
        <Card>
          <Link href="/events/new" style={linkStyle}>
            <h2>➕ Lisää tapahtuma</h2>
          </Link>
        </Card>

        <Card>
          <Link href="/upload" style={linkStyle}>
            <h2>📤 Upload</h2>
          </Link>
        </Card>

        <Card>
          <Link href="/events" style={linkStyle}>
            <h2>📋 Tapahtumat</h2>
          </Link>
        </Card>

        <Card>
          <Link href="/calendar" style={linkStyle}>
            <h2>📅 Kalenteri</h2>
          </Link>
        </Card>
      </div>

      <section style={summaryStyle}>
        <h2>Viimeisimmät tapahtumat</h2>

        {recentEvents.map((event) => (
          <Card key={event.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <b>{formatDate(event.event_date)}</b>
                <div>{event.description}</div>
                <div style={{ color: "#aaa" }}>{eventType(event)}</div>
              </div>

              <strong>
                {formatEuro(parseAmount(event.total_amount))}
              </strong>
            </div>
          </Card>
        ))}
      </section>

      <section style={summaryStyle}>
        <h2>Tulevat tapahtumat</h2>

        {upcomingItems.length === 0 ? (
          <p>Ei tulevia tapahtumia</p>
        ) : (
          upcomingItems.map((event) => (
            <Card key={event.id}>
              <div>
                {event.event_date && (
                  <div>📌 {formatDate(event.event_date)}</div>
                )}

                {event.reminder_date && (
                  <div>🔔 {formatDate(event.reminder_date)}</div>
                )}

                <div>{event.description}</div>
              </div>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}

/* ================== STYLES ================== */

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
};

const summaryStyle: React.CSSProperties = {
  padding: 24,
  border: "1px solid #333",
  borderRadius: 14,
  background: "#181818",
  marginBottom: 24,
};

/* ================== COSTBARS ================== */

function CostBars({
  items,
  max,
}: {
  items: CostItem[];
  max: number;
}) {
  if (items.length === 0) return <p>Ei dataa</p>;

  return (
    <div>
      {items.map((item) => (
        <div key={item.type}>
          <div>{item.label}</div>
          <div
            style={{
              width: `${(item.total / max) * 100}%`,
              height: 10,
              background: getEventTypeColor(item.type),
            }}
          />
        </div>
      ))}
    </div>
  );
}