"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { typeLabels } from "@/lib/typeLabels";
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

  // ✅ Helsinki time helper (sinun versio säilytetty)
  function formatHelsinkiTime(dateString: string) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const helsinki = new Date(
      date.toLocaleString("en-US", {
        timeZone: "Europe/Helsinki",
      })
    );

    return helsinki.toLocaleString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ✅ FILTER + SEARCH
  const filteredEvents = events.filter((e) => {
    const matchesFilter =
      filter === "all" || e.maintenance_type === filter;

    const searchLower = search.toLowerCase();

    const matchesSearch =
      !search ||
      e.description?.toLowerCase().includes(searchLower) ||
      e.company?.toLowerCase().includes(searchLower) ||
      e.notes_short?.toLowerCase().includes(searchLower);

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
  }}
>
  <button onClick={() => router.push("/events/new")}>
    ➕ Lisää uusi tapahtuma
  </button>

  <div style={{ display: "flex", gap: 10 }}>
    <input
      type="text"
      placeholder="Hae (yritys, kuvaus...)"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{ padding: 6 }}
    />

    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
    >
      <option value="all">Kaikki</option>

      {Object.entries(typeLabels).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  </div>
</div>

      {filteredEvents.length === 0 && (
        <p>Ei osumia</p>
      )}

      {/* ✅ HUOM: käytetään filteredEvents */}
      {filteredEvents.map((e) => (
        <Link key={e.id} href={`/events/${e.id}`}>
          <div
            style={{
              border: "1px solid #444",
              padding: 12,
              marginBottom: 10,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <b>{e.description || "Ei kuvausta"}</b>

            <p>
              <b>Tyyppi:</b>{" "}
              {typeLabels[e.maintenance_type] ||
                e.maintenance_type ||
                "📄 Ei tunnistettu"}
            </p>

            <p>
              <b>Yritys:</b> {e.company || "-"}
            </p>

            <p>
              <b>Päivä:</b> {e.date || "-"}
            </p>

            
{e.reminder_date && (
  <p style={{ color: "#ffaa00" }}>
    🗓 {e.reminder_date}
    {e.reminder_text && ` – ${e.reminder_text}`}
  </p>
)}

          </div>
        </Link>
      ))}
    </div>
  );
}