"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getEventTypeLabel } from "@/lib/typeLabels";
import { parseAmount, formatEuro } from "@/lib/costUtils";
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
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);

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

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fi-FI");
  }

  function eventType(event: Event) {
    return getEventTypeLabel(event.maintenance_type);
  }

  // 📅 AIKARAJAT
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const threeWeeksAhead = new Date();
  threeWeeksAhead.setDate(today.getDate() + 21);
  const threeWeeksAheadStr = threeWeeksAhead.toISOString().slice(0, 10);

  // 📌 VIIMEISET 7 VRK
  const recentEvents = events.filter(
    (e) =>
      e.event_date &&
      e.event_date >= weekAgoStr &&
      e.event_date <= todayStr
  );

  // 🔮 TULEVAT 3 VK (tapahtumat + muistutukset)
  const upcomingItems = events.filter(
    (e) =>
      (e.event_date &&
        e.event_date > todayStr &&
        e.event_date <= threeWeeksAheadStr) ||
      (e.reminder_date &&
        e.reminder_date >= todayStr &&
        e.reminder_date <= threeWeeksAheadStr)
  );

  // 💰 YHTEENVETO
  const totalRecent = recentEvents.reduce(
    (sum, e) => sum + parseAmount(e.total_amount),
    0
  );

  const totalUpcoming = upcomingItems.reduce(
    (sum, e) => sum + parseAmount(e.total_amount),
    0
  );

  return (
    <main>
      <h1>🏠 Kotiapplikaatio</h1>

      <p style={{ color: "#9ca3af", marginBottom: 24 }}>
        Kodin huoltojen, muistutusten ja kustannusten hallinta.
      </p>

      {/* 🔗 PIKATOIMINNOT */}
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

      {/* 📊 YHTEENVETO */}
      <section style={sectionStyle}>
        <h2>Yhteenveto</h2>

        <div style={summaryRow}>
          <Card>
            <h3>Viimeiset 7 vrk</h3>
            <p>{formatEuro(totalRecent)}</p>
          </Card>

          <Card>
            <h3>Tulevat 3 vk</h3>
            <p>{formatEuro(totalUpcoming)}</p>
          </Card>
        </div>
      </section>

      {/* 📌 VIIMEISET */}
      <section style={sectionStyle}>
        <h2>Viimeisen 7 päivän tapahtumat</h2>

        {recentEvents.length === 0 ? (
          <p>Ei tapahtumia.</p>
        ) : (
          recentEvents.map((event) => (
            <Card key={event.id}>
              <div style={rowStyle}>
                <div>
                  <b>{formatDate(event.event_date)}</b>
                  <div>{event.description || "Ei kuvausta"}</div>
                  <div style={metaStyle}>{eventType(event)}</div>
                </div>

                <strong>
                  {formatEuro(parseAmount(event.total_amount))}
                </strong>
              </div>
            </Card>
          ))
        )}
      </section>

      {/* 🔮 TULEVAT */}
      <section style={sectionStyle}>
        <h2>Tulevat 3 viikkoa</h2>

        {upcomingItems.length === 0 ? (
          <p>Ei tulevia tapahtumia.</p>
        ) : (
          upcomingItems.map((event) => (
            <Card key={event.id}>
              <div style={rowStyle}>
                <div>
                  {event.event_date && (
                    <div>📌 {formatDate(event.event_date)}</div>
                  )}

                  {event.reminder_date && (
                    <div>🔔 {formatDate(event.reminder_date)}</div>
                  )}

                  <div>
                    {event.description ||
                      event.reminder_text ||
                      "Ei kuvausta"}
                  </div>

                  <div style={metaStyle}>{eventType(event)}</div>
                </div>

                <strong>
                  {formatEuro(parseAmount(event.total_amount))}
                </strong>
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

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
};

const metaStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#9ca3af",
};