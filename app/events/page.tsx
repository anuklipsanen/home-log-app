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
    } else {
      setEvents(data || []);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function addMonths(dateString: string, months: number) {
    if (!dateString) return "";

    const date = new Date(dateString);
    date.setMonth(date.getMonth() + months);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  async function quickSetReminder(
    eventId: string,
    baseDate: string,
    months: number
  ) {
    if (!baseDate) {
      alert("Tapahtumalta puuttuu tapahtumapäivä.");
      return;
    }

    const reminderDate = addMonths(baseDate, months);

    const { error } = await supabase
      .from("events")
      .update({
        reminder_date: reminderDate,
      })
      .eq("id", eventId);

    if (error) {
      console.error(error);
      alert("❌ Muistutuksen päivitys epäonnistui");
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, reminder_date: reminderDate }
          : event
      )
    );
  }

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

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>📋 Tapahtumat</h1>

      <div
        style={{
          marginBottom: 15,
          display: "flex",
          gap: 10,
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
            style={{ padding: 6 }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
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
              padding: 12,
              marginBottom: 10,
              borderRadius: 6,
            }}
          >
            <Link
              href={`/events/${e.id}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <b>{e.description || "Ei kuvausta"}</b>

              <p>
                <b>Tyyppi:</b>{" "}
                {getEventTypeLabel(e.maintenance_type)}
              </p>

              <p>
                <b>Yritys:</b> {e.company || "-"}
              </p>

              <p>
                <b>Tapahtumapäivä:</b>{" "}
                {baseDate ? formatDate(baseDate) : "-"}
              </p>
            </Link>

            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 6,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <b>🔔 Muistutus</b>

              <p style={{ margin: "6px 0" }}>
                <b>Päivä:</b>{" "}
                {e.reminder_date ? formatDate(e.reminder_date) : "-"}
              </p>

              <p style={{ margin: "6px 0" }}>
                <b>Teksti:</b> {e.reminder_text || "-"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => quickSetReminder(e.id, baseDate, 1)}
                >
                  1 kk välein
                </button>

                <button
                  type="button"
                  onClick={() => quickSetReminder(e.id, baseDate, 3)}
                >
                  3 kk välein
                </button>

                <button
                  type="button"
                  onClick={() => quickSetReminder(e.id, baseDate, 6)}
                >
                  6 kk välein
                </button>

                <button
                  type="button"
                  onClick={() => quickSetReminder(e.id, baseDate, 12)}
                >
                  1 v välein
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}