"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getEventTypeLabel } from "@/lib/typeLabels";
import { getUsagePlaceLabel } from "@/lib/usagePlaces";

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);

  async function fetchRows() {
    setLoading(true);

    let query = supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (startDate) {
      query = query.gte("event_date", startDate);
    }

    if (endDate) {
      query = query.lte("event_date", endDate);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      console.error(error);
      alert("❌ Raportin haku epäonnistui");
      return [];
    }

    return data || [];
  }

  function csvEscape(value: any) {
    if (value === null || value === undefined) return "\"\"";

    return `"${String(value).replaceAll("\"", "\"\"")}"`;
  }

  function downloadCsv(rows: any[]) {
    const headers = [
      "Käyttöpaikka",
      "Tapahtumatyyppi",
      "Kuvaus",
      "Tapahtumapäivä",
      "Laskun päivä",
      "Eräpäivä",
      "Yritys",
      "Laskunumero",
      "Kohde / sijainti",
      "Summa",
      "ALV",
      "Työn osuus",
      "Kotitalousvähennys",
      "Muistutuspäivä",
      "Muistutus",
      "Yhteenveto",
      "Lisätiedot",
      "Luotu",
    ];

    const csvRows = [
      headers.map(csvEscape).join(";"),
      ...rows.map((e) =>
        [
          getUsagePlaceLabel(e.usage_place),
          getEventTypeLabel(e.maintenance_type),
          e.description,
          e.event_date,
          e.date,
          e.due_date,
          e.company,
          e.invoice_number,
          e.location,
          e.total_amount,
          e.vat,
          e.work_amount,
          e.is_household_deduction ? "Kyllä" : "Ei",
          e.reminder_date,
          e.reminder_text,
          e.notes_short,
          e.additional_notes,
          e.created_at,
        ]
          .map(csvEscape)
          .join(";")
      ),
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `kotiapplikaatio-raportti-${startDate || "alku"}-${
      endDate || "loppu"
    }.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  async function handleDownload() {
    const rows = await fetchRows();

    if (rows.length === 0) {
      alert("Ei ladattavia rivejä valitulla aikavälillä.");
      return;
    }

    downloadCsv(rows);
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h1>📊 Raportit</h1>

      <p style={{ marginBottom: 24 }}>
        Lataa tapahtumat CSV-muodossa Exceliä varten.
      </p>

      <section style={cardStyle}>
        <h2>Aikarajaus</h2>

        <div style={formGridStyle}>
          <div style={fieldStyle}>
            <label>Alkupäivä</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={fieldStyle}>
            <label>Loppupäivä</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={handleDownload} disabled={loading}>
            {loading ? "Ladataan..." : "⬇️ Lataa CSV"}
          </button>
        </div>
      </section>
    </main>
  );
}

const cardStyle = {
  border: "1px solid #333",
  borderRadius: 14,
  padding: 24,
  background: "#181818",
  marginBottom: 20,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
};