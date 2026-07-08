"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { eventTypes, getEventTypeLabel } from "@/lib/typeLabels";
import {
  usagePlaces,
  getUsagePlaceLabel,
  getUsagePlaceColor,
} from "@/lib/usagePlaces";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const router = useRouter();
  const [showFuture, setShowFuture] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("events")
.select("*")
.not("source_type", "eq", "sport")
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setEvents(data || []);
  }

  function parseAmount(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  return parseFloat(String(value).replace(",", ".")) || 0;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

  function formatDate(dateString: string) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function togglePlace(place: string) {
    setSelectedPlaces((prev) =>
      prev.includes(place)
        ? prev.filter((item) => item !== place)
        : [...prev, place]
    );
  }

  const todayString = new Date().toISOString().split("T")[0];

const filteredEvents = events.filter((e) => {
  const matchesFilter =
    filter === "all" || e.maintenance_type === filter;

  const searchLower = search.toLowerCase();

  const matchesSearch =
    !search ||
    e.description?.toLowerCase().includes(searchLower) ||
    e.company?.toLowerCase().includes(searchLower) ||
    e.notes_short?.toLowerCase().includes(searchLower) ||
    e.reminder_text?.toLowerCase().includes(searchLower);

  const matchesPlace =
  selectedPlaces.length === 0 ||
  selectedPlaces.includes(e.usage_place || "muu");

  // UUSI
  const isFutureEvent =
    e.event_date && e.event_date > todayString;

  const matchesFuture =
    showFuture || !isFutureEvent;

  return (
    matchesFilter &&
    matchesSearch &&
    matchesPlace &&
    matchesFuture
  );
});

  return (
    <main style={{ padding: 20 }}>
      <h1>📋 Tapahtumat</h1>

      <div
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => router.push("/events/new")}>
          ➕ Lisää uusi tapahtuma
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Hae (yritys, kuvaus, muistutus...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
  <option value="all">Kaikki tyypit</option>

  {Object.entries(eventTypes).map(([key, value]) => (
    <option key={key} value={key}>
      {value.label}
    </option>
  ))}
</select>

<label
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }}
>
  <input
    type="checkbox"
    checked={showFuture}
    onChange={(e) => setShowFuture(e.target.checked)}
  />
  Näytä tulevat tapahtumat
</label>
        </div>
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
                  userSelect: "none",
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
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />

                <span>{value.label}</span>
              </label>
            );
          })}
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

      {filteredEvents.length === 0 && <p>Ei osumia</p>}

      {filteredEvents.map((e) => {
  const baseDate = e.event_date || e.date || "";
  const isFutureEvent = e.event_date && e.event_date > todayString;

  return (
    <div
      key={e.id}
      style={{
        border: isFutureEvent ? "1px solid #3b82f6" : "1px solid #444",
        padding: 14,
        marginBottom: 12,
        borderRadius: 8,
        background: isFutureEvent ? "#172033" : "#111",
      }}
    >
      {isFutureEvent && (
        <p style={{ margin: "4px 0", color: "#93c5fd", fontWeight: 700 }}>
          Tuleva tapahtuma
        </p>
      )}

      <Link
        href={`/events/${e.id}`}
        style={{ color: "inherit", textDecoration: "none" }}
      >
        {/* 🔥 HEADER + SUMMA */}
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  }}
>
  {/* LEFT */}
  <div>
    <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>
      {e.description || "Ei kuvausta"}
    </h2>

    <p style={{ margin: "4px 0" }}>
      <b>Tyyppi:</b> {getEventTypeLabel(e.maintenance_type)}
    </p>

    <p style={{ margin: "4px 0" }}>
      <b>Käyttöpaikka:</b> {getUsagePlaceLabel(e.usage_place)}
    </p>

    <p style={{ margin: "4px 0" }}>
      <b>Yritys:</b> {e.company || "-"}
    </p>

    <p style={{ margin: "4px 0" }}>
      <b>Tapahtumapäivä:</b>{" "}
      {baseDate ? formatDate(baseDate) : "-"}
    </p>
  </div>

  {/* RIGHT = SUMMA */}
  {parseAmount(e.total_amount) > 0 && (
    <div
      style={{
        fontWeight: 700,
        fontSize: 18,
        whiteSpace: "nowrap",
        color: "#4ade80",
      }}
    >
      {formatEuro(parseAmount(e.total_amount))}
    </div>
  )}
</div>
      </Link>

      {/* 🔔 MUISTUTUS */}
      {(e.reminder_date || e.reminder_text) && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#111827",
          }}
        >
          <p style={{ margin: "0 0 8px" }}>
            🔔 <b>Muistutus</b>
          </p>

          <p style={{ margin: "6px 0" }}>
            <b>Päivä:</b>{" "}
            {e.reminder_date ? formatDate(e.reminder_date) : "-"}
          </p>

          <p
            style={{
              fontStyle: "italic",
              color: "#374151",
              marginTop: 4,
            }}
          >
            {e.reminder_text || "-"}
          </p>
        </div>
      )}
    </div>
  );
})}
    </main>
  );
}