"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { typeLabels } from "@/lib/typeLabels";

export default function NewEventPage() {
  const router = useRouter();

  const [form, setForm] = useState<any>({
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

  async function handleSave() {
    const { error } = await supabase.from("events").insert([
      {
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
    } else {
      alert("✅ Tapahtuma lisätty");
      router.push("/events");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h1>➕ Lisää uusi tapahtuma</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label>Kuvaus</label>
          <input
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div>
          <label>Tapahtumapäivä</label>
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
          />
        </div>

        <div>
          <label>Laskun päivä</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>

        <div>
          <label>Eräpäivä</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
          />
        </div>

        <div>
          <label>Yritys</label>
          <input
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </div>

        <div>
          <label>Laskunumero</label>
          <input
            value={form.invoice_number}
            onChange={(e) => update("invoice_number", e.target.value)}
          />
        </div>

        <div>
          <label>Kohde / sijainti</label>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>

        <div>
          <label>Summa (€)</label>
          <input
            value={form.total_amount}
            onChange={(e) => update("total_amount", e.target.value)}
          />
        </div>

        <div>
          <label>ALV (€)</label>
          <input
            value={form.vat}
            onChange={(e) => update("vat", e.target.value)}
          />
        </div>

        <div>
          <label>Työn osuus (€)</label>
          <input
            value={form.work_amount}
            onChange={(e) => update("work_amount", e.target.value)}
          />
        </div>

        <div>
          <label>Huollon tyyppi</label>
          <select
            value={form.maintenance_type}
            onChange={(e) => update("maintenance_type", e.target.value)}
          >
            <option value="">Valitse</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
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

        <div>
          <label>Yhteenveto</label>
          <textarea
            value={form.notes_short}
            onChange={(e) => update("notes_short", e.target.value)}
          />
        </div>

        <div>
          <label>Lisätiedot</label>
          <textarea
            value={form.additional_notes}
            onChange={(e) => update("additional_notes", e.target.value)}
          />
        </div>

        <h3>🔔 Muistutus</h3>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => addMonthsToEventDate(1)}>
            1 kk välein
          </button>

          <button type="button" onClick={() => addMonthsToEventDate(3)}>
            3 kk välein
          </button>

          <button type="button" onClick={() => addMonthsToEventDate(6)}>
            6 kk välein
          </button>

          <button type="button" onClick={() => addMonthsToEventDate(12)}>
            1 v välein
          </button>
        </div>

        <div>
          <label>Tarkistuspäivä</label>
          <input
            type="date"
            value={form.reminder_date}
            onChange={(e) => update("reminder_date", e.target.value)}
          />
        </div>

        <div>
          <label>Muistutus</label>
          <input
            value={form.reminder_text}
            onChange={(e) => update("reminder_text", e.target.value)}
            placeholder="Esim. Tarkista suodatin / tilaa huolto"
          />
        </div>
      </div>

      <div style={{ marginTop: 15 }}>
        <button onClick={handleSave}>💾 Tallenna</button>

        <button onClick={() => router.push("/events")} style={{ marginLeft: 10 }}>
          ⬅️ Peruuta
        </button>
      </div>
    </div>
  );
}