"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getEventTypeLabel,
  getEventTypeColor,
} from "@/lib/typeLabels";

type Event = {
  id: string;
  description?: string | null;
  event_date?: string | null;
  reminder_date?: string | null;
  reminder_text?: string | null;
  company?: string | null;
  maintenance_type?: string | null;
  total_amount?: string | number | null;
};

type CostItem = {
  type: string;
  label: string;
  total: number;
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, description, event_date, reminder_date, reminder_text, company, maintenance_type, total_amount"
        )
        .order("event_date", { ascending: false });

      if (error) {
        console.error("Home fetch error:", error);
        return;
      }

      setEvents(data || []);
    }

    fetchEvents();
  }, []);

  function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function parseAmount(value?: string | number | null) {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;

    const normalized = value
      .replace("€", "")
      .replace(/\s/g, "")
      .replace(",", ".");

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function costsByType(start: string, end: string) {
  const totals: Record<string, number> = {};

  events.forEach((event) => {
    // Lasketaan vain varsinaiset tapahtumat, ei muistutuksia
    if (!event.event_date) return;

    if (event.event_date < start || event.event_date > end) return;

    const amount = parseAmount(event.total_amount);

    // Ohitetaan tyhjät ja nollakustannukset
    if (amount <= 0) return;

    const type = event.maintenance_type || "muu";

    totals[type] = (totals[type] || 0) + amount;
  });

  return Object.entries(totals)
    .map(([type, total]) => ({
      type,
      label: getEventTypeLabel(type),
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

  function eventType(event: Event) {
    return getEventTypeLabel(event.maintenance_type);
  }

  const today = new Date();

  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const threeWeeksAhead = new Date(today);
  threeWeeksAhead.setDate(today.getDate() + 21);

  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);

  const yearAhead = new Date(today);
  yearAhead.setFullYear(today.getFullYear() + 1);

  const weekAgoString = toDateString(weekAgo);
  const todayString = toDateString(today);
  const threeWeeksAheadString = toDateString(threeWeeksAhead);
  const yearAgoString = toDateString(yearAgo);
  const yearAheadString = toDateString(yearAhead);

  const recentEvents = events.filter(
    (event) =>
      event.event_date &&
      event.event_date >= weekAgoString &&
      event.event_date <= todayString
  );

  const upcomingItems = events.filter(
    (event) =>
      (event.event_date &&
        event.event_date > todayString &&
        event.event_date <= threeWeeksAheadString) ||
      (event.reminder_date &&
        event.reminder_date >= todayString &&
        event.reminder_date <= threeWeeksAheadString)
  );

  const pastCosts = costsByType(yearAgoString, todayString);
  const futureCosts = costsByType(todayString, yearAheadString);

  return (
    <main>
      <h1>🏠 Kotiapplikaatio</h1>

      <p style={{ marginBottom: 24 }}>
        Kodin huoltojen, dokumenttien ja muistutusten hallinta yhdessä paikassa.
      </p>

      <div className="home-grid">
        <Link href="/events/new" style={cardStyle}>
          <h2>➕ Lisää tapahtuma</h2>
          <p>Luo uusi tapahtuma käsin ilman tiedoston lataamista.</p>
        </Link>

        <Link href="/upload" style={cardStyle}>
          <h2>📤 Upload</h2>
          <p>Lataa lasku, kuitti tai dokumentti ja anna AI:n tulkita tiedot.</p>
        </Link>

        <Link href="/events" style={cardStyle}>
          <h2>📋 Tapahtumat</h2>
          <p>Selaa ja muokkaa tallennettuja huoltoja ja tapahtumia.</p>
        </Link>

        <Link href="/calendar" style={cardStyle}>
          <h2>📅 Kalenteri</h2>
          <p>Näe tapahtumat ja muistutukset kalenterinäkymässä.</p>
        </Link>
      </div>

      <section style={summaryStyle}>
        <h2>Rahankäyttö luokittain</h2>

        <h3>Viimeiset 12 kuukautta</h3>
        <CostBars items={pastCosts} />

        <h3>Seuraavat 12 kuukautta</h3>
        <CostBars items={futureCosts} />
      </section>

      <section style={summaryStyle}>
        <h2>Yhteenveto</h2>

        <h3>Viimeisen 7 päivän tapahtumat</h3>
        {recentEvents.length === 0 ? (
          <p>Ei tapahtumia viimeisen viikon ajalta.</p>
        ) : (
          recentEvents.map((event) => (
            <p key={`recent-${event.id}`}>
              📌 <b>{formatDate(event.event_date)}</b> –{" "}
              <b>{eventType(event)}</b> –{" "}
              {event.description || event.company || "Ei kuvausta"}
            </p>
          ))
        )}

        <h3>Tulevat 3 viikkoa</h3>
        {upcomingItems.length === 0 ? (
          <p>Ei tulevia tapahtumia tai muistutuksia seuraavan 3 viikon aikana.</p>
        ) : (
          upcomingItems.map((event) => (
            <div key={`upcoming-${event.id}`} style={{ marginBottom: 8 }}>
              {event.event_date &&
                event.event_date > todayString &&
                event.event_date <= threeWeeksAheadString && (
                  <p>
                    📌 <b>{formatDate(event.event_date)}</b> –{" "}
                    <b>{eventType(event)}</b> –{" "}
                    {event.description || event.company || "Ei kuvausta"}
                  </p>
                )}

              {event.reminder_date &&
                event.reminder_date >= todayString &&
                event.reminder_date <= threeWeeksAheadString && (
                  <p>
                    🔔 <b>{formatDate(event.reminder_date)}</b> –{" "}
                    <b>{eventType(event)}</b> –{" "}
                    {event.reminder_text || event.description || "Muistutus"}
                  </p>
                )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function CostBars({ items }: { items: CostItem[] }) {
  if (items.length === 0) {
    return <p>Ei kustannustietoja.</p>;
  }

  const max = Math.max(...items.map((item) => item.total));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => {
        const width =
          max > 0 ? `${Math.max((item.total / max) * 100, 4)}%` : "0%";

        return (
          <div key={item.type}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 4,
              }}
            >
              <span>{item.label}</span>
              <strong>{item.total.toFixed(2)} €</strong>
            </div>

            <div
              style={{
                height: 12,
                borderRadius: 999,
                background: "#2a2a2a",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width,
                  height: "100%",
                  borderRadius: 999,
                  background: getEventTypeColor(item.type),
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const cardStyle = {
  display: "block",
  padding: 24,
  border: "1px solid #333",
  borderRadius: 14,
  textDecoration: "none",
  color: "inherit",
  background: "#181818",
};

const summaryStyle = {
  padding: 24,
  border: "1px solid #333",
  borderRadius: 14,
  background: "#181818",
  marginBottom: 24,
};