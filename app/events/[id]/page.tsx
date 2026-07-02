"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { eventTypes, getEventTypeLabel } from "@/lib/typeLabels";

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [eventData, setEventData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  const inputStyle = {
    background: "#f3f4f6",
    color: "#111",
    border: "1px solid #9ca3af",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 16,
  };

  const buttonStyle = {
    border: "1px solid #9ca3af",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 16,
    cursor: "pointer",
    background: "#f3f4f6",
    color: "#111",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: "#2563eb",
    color: "white",
    border: "1px solid #1d4ed8",
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: "#dc2626",
    color: "white",
    border: "1px solid #991b1b",
  };

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  async function fetchEvent() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Fetch error:", error);
      return;
    }

    setEventData(data);
  }

  function update(field: string, value: any) {
    setEventData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  function addMonthsToEventDate(months: number) {
    if (!eventData?.event_date && !eventData?.date) {
      alert("Lisää ensin tapahtumapäivä.");
      return;
    }

    const baseDate = new Date(eventData.event_date || eventData.date);
    baseDate.setMonth(baseDate.getMonth() + months);

    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");

    update("reminder_date", `${y}-${m}-${d}`);
  }

  function formatHelsinkiTime(dateString: string) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const helsinki = new Date(
      date.toLocaleString("en-US", {
        timeZone: "Europe/Helsinki",
      })
    );

    return helsinki.toLocaleString("fi-FI", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSave() {
    if (!eventData) return;

    const { error } = await supabase
      .from("events")
      .update({
        description: eventData.description,
        event_date: eventData.event_date,
        date: eventData.date,
        due_date: eventData.due_date,
        company: eventData.company,
        invoice_number: eventData.invoice_number,
        total_amount: eventData.total_amount,
        vat: eventData.vat,
        work_amount: eventData.work_amount,
        is_household_deduction: eventData.is_household_deduction,
        location: eventData.location,
        notes_short: eventData.notes_short,
        maintenance_type: eventData.maintenance_type,
        additional_notes: eventData.additional_notes,
        highlights: eventData.highlights,
        items: eventData.items,
        document_notes: eventData.document_notes,
        reminder_date: eventData.reminder_date,
        reminder_text: eventData.reminder_text,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("❌ Päivitys epäonnistui");
    } else {
      alert("✅ Päivitetty!");
      setEditMode(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Haluatko varmasti poistaa tapahtuman?")) return;

    if (eventData?.file_url) {
      const path = eventData.file_url.split(
        "/storage/v1/object/public/attachments/"
      )[1];

      if (path) {
        await supabase.storage.from("attachments").remove([path]);
      }
    }

    await supabase.from("events").delete().eq("id", id);
    router.push("/events");
  }

  if (!eventData) return <p>Ladataan...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button onClick={() => router.back()} style={buttonStyle}>
          ⬅️ Takaisin
        </button>

        <button onClick={() => router.push("/upload")} style={buttonStyle}>
          🏠 Upload
        </button>
      </div>

      <h2>
        {editMode ? (
          <input
            value={eventData.description || ""}
            onChange={(e) => update("description", e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        ) : (
          eventData.description || "Ei kuvausta"
        )}
      </h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setEditMode(!editMode)} style={buttonStyle}>
          ✏️ {editMode ? "Valmis" : "Muokkaa"}
        </button>

        <button onClick={handleSave} style={primaryButtonStyle}>
          💾 Tallenna
        </button>

        <button onClick={handleDelete} style={dangerButtonStyle}>
          🗑 Poista
        </button>
      </div>

      <p style={{ fontSize: 12 }}>
        Lisätty: {formatHelsinkiTime(eventData.created_at)}
      </p>

      {eventData.file_url && (
        <a href={eventData.file_url} target="_blank">
          📄 Avaa tiedosto
        </a>
      )}

      <p>
        <b>Tyyppi:</b>{" "}
        {editMode ? (
          <select
            value={eventData.maintenance_type || ""}
            onChange={(e) => update("maintenance_type", e.target.value)}
            style={inputStyle}
          >
            {Object.entries(eventTypes).map(([key, value]) => (
  <option key={key} value={key}>
    {value.label}
  </option>
))}
          </select>
        ) : (
          getEventTypeLabel(eventData.maintenance_type)
        )}
      </p>

      <p>
        <b>Tapahtumapäivä:</b>{" "}
        {editMode ? (
          <input
            type="date"
            value={eventData.event_date || ""}
            onChange={(e) => update("event_date", e.target.value)}
            style={inputStyle}
          />
        ) : (
          eventData.event_date || "-"
        )}
      </p>

      <h3>🔔 Muistutus</h3>

      <div>
        <b>Tarkistuspäivä:</b>{" "}
        {editMode ? (
          <div style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => addMonthsToEventDate(1)} style={buttonStyle}>
                1 kk
              </button>
              <button type="button" onClick={() => addMonthsToEventDate(3)} style={buttonStyle}>
                3 kk
              </button>
              <button type="button" onClick={() => addMonthsToEventDate(6)} style={buttonStyle}>
                6 kk
              </button>
              <button type="button" onClick={() => addMonthsToEventDate(12)} style={buttonStyle}>
                1 v
              </button>
            </div>

            <input
              type="date"
              value={eventData.reminder_date || ""}
              onChange={(e) => update("reminder_date", e.target.value)}
              style={inputStyle}
            />
          </div>
        ) : (
          eventData.reminder_date || "-"
        )}
      </div>

      <p>
        <b>Muistutus:</b>{" "}
        {editMode ? (
          <input
            value={eventData.reminder_text || ""}
            onChange={(e) => update("reminder_text", e.target.value)}
            placeholder="Esim. Tarkista suodatin / tilaa huolto"
            style={{ ...inputStyle, minWidth: 320 }}
          />
        ) : (
          eventData.reminder_text || "-"
        )}
      </p>

      {[
  ["date", "Laskun päivä"],
  ["due_date", "Eräpäivä"],
  ["company", "Yritys"],
  ["invoice_number", "Laskunumero"],
  ["location", "Kohde"],
  ["total_amount", "Summa"],
  ["vat", "ALV"],
  ["work_amount", "Työn osuus"],
].map(([key, label]) => (
  <p key={key}>
    <b>{label}:</b>{" "}

    {editMode ? (
      key === "date" || key === "due_date" ? (
        <input
          type="date"
          value={eventData[key] || ""}
          onChange={(e) => update(key as string, e.target.value)}
          style={inputStyle}
        />
      ) : (
        <input
          value={eventData[key] || ""}
          onChange={(e) => update(key as string, e.target.value)}
          style={inputStyle}
        />
      )
    ) : (
      `${eventData[key] || "-"}${
        key.includes("amount") || key === "vat" ? " €" : ""
      }`
    )}
  </p>
))}

      <p>
        <b>Kotitalousvähennys:</b>{" "}
        {editMode ? (
          <input
            type="checkbox"
            checked={eventData.is_household_deduction || false}
            onChange={(e) => update("is_household_deduction", e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        ) : eventData.is_household_deduction ? (
          "✅ Kyllä"
        ) : (
          "❌ Ei"
        )}
      </p>

      <h3>🛠️ Highlights</h3>
      {eventData.highlights?.map((h: string, i: number) => (
        <div key={i}>
          {editMode ? (
            <input
              value={h}
              onChange={(e) => {
                const arr = [...eventData.highlights];
                arr[i] = e.target.value;
                update("highlights", arr);
              }}
              style={inputStyle}
            />
          ) : (
            <p>✅ {h}</p>
          )}
        </div>
      ))}

      <h3>📄 Lisätiedot</h3>
      {editMode ? (
        <textarea
          value={eventData.additional_notes || ""}
          onChange={(e) => update("additional_notes", e.target.value)}
          style={{
            ...inputStyle,
            width: "100%",
          }}
        />
      ) : (
        <div
  style={{
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    lineHeight: 1.6,
    background: "#1f1f1f",
    border: "1px solid #444",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  }}
>
  {eventData.additional_notes}
</div>
      )}
    </div>
  );
}