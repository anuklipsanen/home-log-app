"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { eventTypes, getEventTypeLabel } from "@/lib/typeLabels";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setEvents(data || []);
  }

  function formatDate(dateString: string) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const filteredEvents = events.filter((e) => {
    const matchesFilter = filter === "all" || e.maintenance_type === filter;
    const searchLower = search.toLowerCase();

    const matchesSearch =
      !search ||
      e.description?.toLowerCase().includes(searchLower) ||
      e.company?.toLowerCase().includes(searchLower) ||
      e.notes_short?.toLowerCase().includes(searchLower) ||
      e.reminder_text?.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
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
            <option value="all">Kaikki</option>

            {Object.entries(eventTypes).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 && <p>Ei osumia</p>}

      {filteredEvents.map((e) => {
        const baseDate = e.event_date || e.date || "";

        return (
          <div
            key={e.id}
            style={{
              border: "1px solid #444",
              padding: 14,
              marginBottom: 12,
              borderRadius: 8,
              background: "#111",
            }}
          >
            <Link
              href={`/events/${e.id}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>
                {e.description || "Ei kuvausta"}
              </h2>

              <p style={{ margin: "4px 0" }}>
                <b>Tyyppi:</b> {getEventTypeLabel(e.maintenance_type)}
              </p>

              <p style={{ margin: "4px 0" }}>
                <b>Yritys:</b> {e.company || "-"}
              </p>

              <p style={{ margin: "4px 0" }}>
                <b>Tapahtumapäivä:</b>{" "}
                {baseDate ? formatDate(baseDate) : "-"}
              </p>
            </Link>

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
    color: "#d1d5db",
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