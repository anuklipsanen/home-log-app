"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { eventTypes } from "@/lib/typeLabels";
import { reminderPresets } from "@/lib/reminderPresets";
import { usagePlaces } from "@/lib/usagePlaces";
import { getEventTypeOptionsForUsagePlace } from "@/lib/eventTypeGroups";

export default function NewEventPage() {
  const router = useRouter();

  const [form, setForm] = useState<any>({
    usage_place: "muu",
    description: "",
    event_date: new Date().toISOString().split("T")[0],
    date: "",
    due_date: "",
    company: "",
    invoice_number: "",
    location: "",
    total_amount: "",
    vat: "",
    work_amount: "",
    maintenance_type: "",
    notes_short: "",
    additional_notes: "",
    reminder_date: "",
    reminder_text: "",
    is_household_deduction: false,
  });

  const cardStyle = {
    border: "1px solid #333",
    borderRadius: 14,
    padding: 24,
    background: "#181818",
    marginBottom: 20,
    maxWidth: 900,
  };

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    alignItems: "start",
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  };

  const inputStyle = {
    width: "100%",
  };

  const buttonStyle = {
    padding: "12px 18px",
    borderRadius: 10,
    border: "1px solid #555",
    background: "#2d2d2d",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: "#2563eb",
    border: "1px solid #1d4ed8",
  };

  function update(field: string, value: any) {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  function addMonthsToEventDate(months: number) {
    if (!form.event_date && !form.date) {
      alert("Lisää ensin tapahtumapäivä.");
      return;
    }

    const baseDate = new Date(form.event_date || form.date);
    baseDate.setMonth(baseDate.getMonth() + months);

    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");

    update("reminder_date", `${y}-${m}-${d}`);
  }

  function copyInvoiceDateToEventDate() {
  if (!form.date) {
    alert("Laskun päivää ei ole asetettu.");
    return;
  }

  update("event_date", form.date);
}

  async function handleSave() {
    const { error } = await supabase.from("events").insert([
      {
        usage_place: form.usage_place || "muu",
        description: form.description || "",
        event_date: form.event_date || "",
        date: form.date || "",
        due_date: form.due_date || "",
        company: form.company || "",
        invoice_number: form.invoice_number || "",
        location: form.location || "",
        total_amount: form.total_amount || "",
        vat: form.vat || "",
        work_amount: form.work_amount || "",
        maintenance_type: form.maintenance_type || "",
        notes_short: form.notes_short || "",
        additional_notes: form.additional_notes || "",
        reminder_date: form.reminder_date || "",
        reminder_text: form.reminder_text || "",
        is_household_deduction: form.is_household_deduction || false,
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Tallennus epäonnistui");
      return;
    }

    alert("✅ Tapahtuma lisätty");
    router.push("/events");
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h1>➕ Lisää uusi tapahtuma</h1>

      <section style={cardStyle}>
        <h2>Perustiedot</h2>
        
        <div style={formGridStyle}>
          
          <div style={fieldStyle}>
  <label>Käyttöpaikka</label>

  <select
    value={form.usage_place || "muu"}
    onChange={(e) => update("usage_place", e.target.value)}
    style={inputStyle}
  >
    {Object.entries(usagePlaces).map(([key, value]) => (
      <option key={key} value={key}>
        {value.label}
      </option>
    ))}
  </select>
</div>
          
          <div style={fieldStyle}>
            <label>Kuvaus</label>
            <input
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Esim. ILP-huolto, nuohous, sähkötyö..."
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
  <label>Tapahtumapäivä</label>

  <div
    style={{
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}
  >
    <input
      type="date"
      value={form.event_date}
      onChange={(e) => update("event_date", e.target.value)}
      style={{
        ...inputStyle,
        flex: 1,
      }}
    />

    <button
      type="button"
      onClick={copyInvoiceDateToEventDate}
      title="Kopioi laskun päivä"
    >
      📄→📅
    </button>
  </div>
</div>

          <div style={fieldStyle}>
            <label>Huollon tyyppi</label>
            <select
              value={form.maintenance_type}
              onChange={(e) => update("maintenance_type", e.target.value)}
              style={inputStyle}
            >
              <option value="">Valitse</option>
              {getEventTypeOptionsForUsagePlace(form.usage_place).map(([key, value]) => (
  <option key={key} value={key}>
    {value.label}
  </option>
))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label>Yritys</label>
            <input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Kohde / sijainti</label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h2>Laskutiedot</h2>

        <div style={formGridStyle}>
          <div style={fieldStyle}>
            <label>Laskun päivä</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Eräpäivä</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => update("due_date", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Laskunumero</label>
            <input
              value={form.invoice_number}
              onChange={(e) => update("invoice_number", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Summa (€)</label>
            <input
  type="number"
  step="0.01"
  min="0"
  value={form.total_amount}
  onChange={(e) => update("total_amount", e.target.value)}
  style={inputStyle}
/>
          </div>

          <div style={fieldStyle}>
            <label>ALV (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.vat}
              onChange={(e) => update("vat", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Työn osuus (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.work_amount}
              onChange={(e) => update("work_amount", e.target.value)}
              style={inputStyle}
            />
          </div>

          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_household_deduction}
              onChange={(e) =>
                update("is_household_deduction", e.target.checked)
              }
            />
            Kotitalousvähennys
          </label>
        </div>
      </section>

      <section style={cardStyle}>
        <h2>🔔 Muistutus</h2>

        <div
  style={{
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  }}
>
  {reminderPresets.map((preset) => (
  <button
    key={preset.months}
    type="button"
    onClick={() => addMonthsToEventDate(preset.months)}
  >
    {preset.label}
  </button>
))}
</div>

        <div style={formGridStyle}>
          <div style={fieldStyle}>
            <label>Tarkistuspäivä</label>
            <input
              type="date"
              value={form.reminder_date}
              onChange={(e) => update("reminder_date", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Muistutus</label>
            <input
              value={form.reminder_text}
              onChange={(e) => update("reminder_text", e.target.value)}
              placeholder="Esim. Tarkista suodatin / tilaa huolto"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h2>Lisätiedot</h2>

        <div style={formGridStyle}>
          <div style={fieldStyle}>
            <label>Yhteenveto</label>
            <textarea
              value={form.notes_short}
              onChange={(e) => update("notes_short", e.target.value)}
              style={{ ...inputStyle}}
            />
          </div>

          <div style={fieldStyle}>
            <label>Lisätiedot</label>
            <textarea
              value={form.additional_notes}
              onChange={(e) => update("additional_notes", e.target.value)}
              style={{ ...inputStyle}}
            />
          </div>
        </div>
      </section>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 40,
        }}
      >
        <button onClick={handleSave} style={primaryButtonStyle}>
          💾 Tallenna
        </button>

        <button onClick={() => router.push("/events")} style={buttonStyle}>
          ⬅️ Peruuta
        </button>
      </div>
    </main>
  );
}