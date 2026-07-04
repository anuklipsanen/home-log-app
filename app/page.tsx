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
        .select(
          "id, description, event_date, reminder_date, reminder_text, company, maintenance_type, total_amount, usage_place"
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

  function togglePlace(place: string) {
    setSelectedPlaces((prev) =>
      prev.includes(place)
        ? prev.filter((p) => p !== place)
        : [...prev, place]
    );
  }

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

  function eventType(event: Event) {
    return getEventTypeLabel(event.maintenance_type);
  }

  function costsByType(sourceEvents: Event[], start: string, end: string) {
    const totals: Record<string, number> = {};

    sourceEvents.forEach((event) => {
      if (!event.event_date) return;
      if (event.event_date < start || event.event_date > end) return;

      const amount = parseAmount(event.total_amount);
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

  const visibleEvents =
    selectedPlaces.length === 0
      ? events
      : events.filter((event) =>
          selectedPlaces.includes(event.usage_place || "muu")
        );

  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

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
  const tomorrowString = toDateString(tomorrow);
  const threeWeeksAheadString = toDateString(threeWeeksAhead);
  const yearAgoString = toDateString(yearAgo);
  const yearAheadString = toDateString(yearAhead);

  const recentEvents = visibleEvents.filter(
    (event) =>
      event.event_date &&
      event.event_date >= weekAgoString &&
      event.event_date <= todayString
  );

  const upcomingItems = visibleEvents.filter(
    (event) =>
      (event.event_date &&
        event.event_date > todayString &&
        event.event_date <= threeWeeksAheadString) ||
      (event.reminder_date &&
        event.reminder_date >= todayString &&
        event.reminder_date <= threeWeeksAheadString)
  );

  const pastCosts = costsByType(visibleEvents, yearAgoString, todayString);
  const futureCosts = costsByType(
    visibleEvents,
    tomorrowString,
    yearAheadString
  );

  const sharedCostMax = Math.max(
    ...pastCosts.map((item) => item.total),
    ...futureCosts.map((item) => item.total),
    0
  );

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ marginBottom: 6 }}>
  🏠 Kotiapplikaatio
</h1>

<p style={{ color: "#9ca3af", marginBottom: 24 }}>
  Huollot, kustannukset ja muistutukset yhdessä näkymässä
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
        <h2 style={sectionTitle}>📍 Käyttöpaikat</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            onClick={() => setSelectedPlaces([])}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: "1px solid #555",
              background: selectedPlaces.length === 0 ? "#2563eb" : "#111",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Kaikki
          </button>

          {Object.entries(usagePlaces).map(([key, value]) => {
            const selected = selectedPlaces.includes(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePlace(key)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: `2px solid ${value.color}`,
                  background: selected ? value.color : "transparent",
                  color: selected ? "#111" : "#fff",
                  fontWeight: 600,
                }}
              >
                {value.label}
              </button>
            );
          })}
        </div>
      </section>

      <section style={summaryStyle}>
        <h2 style={sectionTitle}>💰 Rahankäyttö</h2>

        <div style={summaryBlockStyle}>
          <h3 style={{...summaryHeadingStyle, opacity: 0.9}}>Viimeiset 12 kuukautta</h3>
          <CostBars
  items={pastCosts}
  max={sharedCostMax}
  events={visibleEvents}
  start={yearAgoString}
  end={todayString}
  openCostType={openCostType}
  setOpenCostType={setOpenCostType}
/>
        </div>

        <div style={summaryBlockStyle}>
          <h3 style={{ ...summaryHeadingStyle, opacity: 0.9 }}>Seuraavat 12 kuukautta</h3>
          <CostBars
  items={futureCosts}
  max={sharedCostMax}
  events={visibleEvents}
  start={tomorrowString}
  end={yearAheadString}
  openCostType={openCostType}
  setOpenCostType={setOpenCostType}
/>
        </div>
      </section>

      <section style={summaryStyle}>
        <h2 style={sectionTitle}>📊 Yhteenveto</h2>

        <div style={summaryBlockStyle}>
          <h3 style={{ ...summaryHeadingStyle, opacity: 0.9 }}>Viimeisen 7 päivän tapahtumat</h3>

          {recentEvents.length === 0 ? (
            <p>Ei tapahtumia viimeisen viikon ajalta.</p>
          ) : (
            recentEvents.map((event) => (

  <Link
    key={`recent-${event.id}`}
    href={`/events/${event.id}`}
    style={{ textDecoration: "none", color: "inherit" }}
  >
    <Card>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontWeight: 600 }}>
          📌 {formatDate(event.event_date)}
        </div>

        <div style={{ opacity: 0.8, marginTop: 4 }}>
          {event.description || event.company || "Ei kuvausta"}
        </div>

        <div style={{ marginTop: 6, fontSize: 14, color: "#9ca3af" }}>
          {eventType(event)}
        </div>
      </div>

      {parseAmount(event.total_amount) > 0 && (
  <strong>
    {formatEuro(parseAmount(event.total_amount))}
  </strong>
)}
    </div>
  </Card>
  </Link>
))
          )}
        </div>

        <div style={summaryBlockStyle}>
          <h3 style={{ ...summaryHeadingStyle, opacity: 0.9 }}>Tulevat 3 viikkoa</h3>

          {upcomingItems.length === 0 ? (
            <p>
              Ei tulevia tapahtumia tai muistutuksia seuraavan 3 viikon aikana.
            </p>
          ) : (
            upcomingItems.map((event) => (
              <Link
  key={`upcoming-${event.id}`}
  href={`/events/${event.id}`}
  style={{
    display: "block",
    marginBottom: 8,
    textDecoration: "none",
    color: "inherit",
  }}
>
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
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function CostBars({
  items,
  max,
  events,
  start,
  end,
  openCostType,
  setOpenCostType,
}: {
  items: CostItem[];
  max: number;
  events: Event[];
  start: string;
  end: string;
  openCostType: string | null;
  setOpenCostType: (type: string | null) => void;
}) {
  if (items.length === 0) {
    return <p>Ei kustannustietoja.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item) => {
        const width =
          max > 0 ? `${Math.max((item.total / max) * 100, 4)}%` : "0%";

        const typeEvents = events
          .filter(
            (event) =>
              event.maintenance_type === item.type &&
              event.event_date &&
              event.event_date >= start &&
              event.event_date <= end &&
              parseAmount(event.total_amount) > 0
          )
          .sort((a, b) =>
            String(b.event_date).localeCompare(String(a.event_date))
          );

        const isOpen = openCostType === item.type;

        return (
          <div key={item.type}>
            <div
              onClick={() => setOpenCostType(isOpen ? null : item.type)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 4,
                padding: "4px 0",
                borderRadius: 6,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                  }}
                >
                  {isOpen ? "▼" : "▶"}
                </span>

                {item.label}
              </span>

              <strong>{formatEuro(item.total)}</strong>
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

            {isOpen && (
              <div
                style={{
                  marginTop: 10,
                  marginBottom: 14,
                  marginLeft: 22,
                  padding: 12,
                  borderRadius: 10,
                  background: "#0b1220",
                  border: "1px solid #263248",
                }}
              >
                {typeEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid #1e293b",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {event.event_date
  ? new Date(event.event_date).toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  : "-"}
                      </div>

                      <div
                        style={{
                          color: "#cbd5e1",
                          fontSize: 14,
                          marginTop: 2,
                        }}
                      >
                        {event.description || event.company || "Ei kuvausta"}
                      </div>
                    </div>

                    {parseAmount(event.total_amount) > 0 && (
  <strong>
    {formatEuro(parseAmount(event.total_amount))}
  </strong>
)}
                  </Link>
                ))}
              </div>
            )}
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

const summaryBlockStyle = {
  marginTop: 18,
  padding: 16,
  borderRadius: 12,
  background: "#111827",
  border: "1px solid #374151",
};

const summaryHeadingStyle = {
  margin: "0 0 12px",
  fontSize: 20,
  color: "#ffffff",
};

const sectionTitle: React.CSSProperties = {
  marginBottom: 12,
  fontSize: 22,
  fontWeight: 700,
};