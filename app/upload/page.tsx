"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { eventTypes } from "@/lib/typeLabels";

export default function UploadPage() {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

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

  function todayString() {
    return new Date().toISOString().split("T")[0];
  }

  function updateField(field: string, value: any) {
    setAiData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  function addMonthsToEventDate(months: number) {
    if (!aiData?.event_date && !aiData?.date) {
      alert("Lisää ensin tapahtumapäivä.");
      return;
    }

    const baseDate = new Date(aiData.event_date || aiData.date);
    baseDate.setMonth(baseDate.getMonth() + months);

    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");

    updateField("reminder_date", `${y}-${m}-${d}`);
  }

  async function handleUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setAiData(null);
    setEditMode(false);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");

      const { data, error } = await supabase.storage
        .from("attachments")
        .upload(`files/${Date.now()}-${safeName}`, file);

      if (error || !data?.path) {
        console.error("Upload error:", error);
        alert("❌ Tiedoston lataus epäonnistui");
        return;
      }

      const url = supabase.storage
        .from("attachments")
        .getPublicUrl(data.path).data.publicUrl;

      setFileUrl(url);

      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl: url }),
      });

      const json = await res.json();

      try {
        const parsed = JSON.parse(json.parsed);

        setAiData({
          ...parsed,
          reminder_date: parsed.reminder_date || "",
          reminder_text: parsed.reminder_text || "",
          event_date: parsed.event_date || todayString(),
        });

        setEditMode(true);
      } catch (err) {
        console.error("JSON parse error:", err);

        setAiData({
          description: "",
          date: "",
          due_date: "",
          company: "",
          invoice_number: "",
          total_amount: "",
          vat: "",
          work_amount: "",
          is_household_deduction: false,
          location: "",
          notes_short: "",
          maintenance_type: "",
          highlights: [],
          items: [],
          document_notes: [],
          additional_notes: "",
          reminder_date: "",
          reminder_text: "",
          event_date: todayString(),
        });

        setEditMode(true);
        alert("AI ei tunnistanut tietoja. Voit täyttää tiedot käsin.");
      }
    } catch (err) {
      console.error("General error:", err);
      alert("❌ Virhe tiedoston käsittelyssä");
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!aiData) return;

    const finalDescription =
      aiData.description ||
      aiData.notes_short ||
      aiData.highlights?.[0] ||
      "Huoltotoimenpide";

    const payload = {
      description: finalDescription,
      date: aiData.date || "",
      due_date: aiData.due_date || "",
      company: aiData.company || "",
      invoice_number: aiData.invoice_number || "",
      total_amount: aiData.total_amount || "",
      vat: aiData.vat || "",
      work_amount: aiData.work_amount || "",
      is_household_deduction: aiData.is_household_deduction || false,
      location: aiData.location || "",
      notes_short: aiData.notes_short || "",
      maintenance_type: aiData.maintenance_type || "",
      highlights: aiData.highlights || [],
      items: aiData.items || [],
      document_notes: aiData.document_notes || [],
      additional_notes: aiData.additional_notes || "",
      event_date: aiData.event_date || "",
      reminder_date: aiData.reminder_date || "",
      reminder_text: aiData.reminder_text || "",
      data: aiData,
      file_url: fileUrl,
    };

    const { error } = await supabase.from("events").insert([payload]);

    if (error) {
      console.error(error);
      alert("❌ Tallennus epäonnistui");
      return;
    }

    alert("✅ Tallennettu!");
    window.location.href = "/events";
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h1>📤 Upload tiedosto</h1>

      <section style={cardStyle}>
        <h2>Valitse dokumentti</h2>

        <p>
          Lataa lasku, kuitti tai muu dokumentti. AI yrittää tunnistaa tiedot,
          mutta voit muokata kaikkea ennen tallennusta.
        </p>

        <label
          style={{
            display: "inline-block",
            marginTop: 12,
            padding: "14px 20px",
            borderRadius: 12,
            border: "1px solid #1d4ed8",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          📁 Valitse tiedosto
          <input
            type="file"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>

        {fileUrl && (
          <p style={{ marginTop: 14 }}>
            ✅ Upload valmis:{" "}
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              Avaa tiedosto
            </a>
          </p>
        )}
      </section>

      {loading && (
        <section style={{ ...cardStyle, border: "1px solid #3b82f6" }}>
          ⏳ AI analysoi dokumenttia...
        </section>
      )}

      {aiData && (
        <>
          <section style={cardStyle}>
            <h2>Perustiedot</h2>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <button onClick={() => setEditMode(!editMode)} style={buttonStyle}>
                ✏️ {editMode ? "Valmis" : "Muokkaa"}
              </button>

              <button onClick={handleSave} style={primaryButtonStyle}>
                💾 Tallenna
              </button>
            </div>

            <div style={formGridStyle}>
              <div style={fieldStyle}>
                <label>Kuvaus</label>
                <input
                  value={aiData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Esim. Sähköremontti keittiössä"
                  disabled={!editMode}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label>Tapahtumapäivä</label>
                <input
                  type="date"
                  value={aiData.event_date || ""}
                  onChange={(e) => updateField("event_date", e.target.value)}
                  disabled={!editMode}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label>Huollon tyyppi</label>
                <select
                  value={aiData.maintenance_type || ""}
                  onChange={(e) =>
                    updateField("maintenance_type", e.target.value)
                  }
                  disabled={!editMode}
                  style={inputStyle}
                >
                  <option value="">Valitse</option>
                  {Object.entries(eventTypes).map(([key, value]) => (
  <option key={key} value={key}>
    {value.label}
  </option>
))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label>Yritys</label>
                <input
                  value={aiData.company || ""}
                  onChange={(e) => updateField("company", e.target.value)}
                  disabled={!editMode}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label>Kohde</label>
                <input
                  value={aiData.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  disabled={!editMode}
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2>Laskutiedot</h2>

            <div style={formGridStyle}>
              {[
                ["date", "Laskun päivä"],
                ["due_date", "Eräpäivä"],
                ["invoice_number", "Laskunumero"],
                ["total_amount", "Summa (€)"],
                ["vat", "ALV (€)"],
                ["work_amount", "Työn osuus (€)"],
              ].map(([key, label]) => (
                <div key={key} style={fieldStyle}>
                  <label>{label}</label>
                  <input
                    type={
                      key === "date" || key === "due_date" ? "date" : "text"
                    }
                    value={aiData[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    disabled={!editMode}
                    style={inputStyle}
                  />
                </div>
              ))}

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
                  checked={aiData.is_household_deduction || false}
                  onChange={(e) =>
                    updateField("is_household_deduction", e.target.checked)
                  }
                  disabled={!editMode}
                />
                Kotitalousvähennys
              </label>
            </div>
          </section>

          <section style={cardStyle}>
            <h2>🔔 Muistutus</h2>

            {editMode && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                {[1, 3, 6, 12].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => addMonthsToEventDate(months)}
                    style={buttonStyle}
                  >
                    {months === 12 ? "1 v välein" : `${months} kk välein`}
                  </button>
                ))}
              </div>
            )}

            <div style={formGridStyle}>
              <div style={fieldStyle}>
                <label>Tarkistuspäivä</label>
                <input
                  type="date"
                  value={aiData.reminder_date || ""}
                  onChange={(e) => updateField("reminder_date", e.target.value)}
                  disabled={!editMode}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label>Muistutus</label>
                <input
                  value={aiData.reminder_text || ""}
                  onChange={(e) => updateField("reminder_text", e.target.value)}
                  placeholder="Esim. Tarkista suodatin / tilaa huolto"
                  disabled={!editMode}
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
                  value={aiData.notes_short || ""}
                  onChange={(e) => updateField("notes_short", e.target.value)}
                  disabled={!editMode}
                  style={{ ...inputStyle, minHeight: 90 }}
                />
              </div>

              <div style={fieldStyle}>
                <label>Lisätiedot</label>
                <textarea
                  value={aiData.additional_notes || ""}
                  onChange={(e) =>
                    updateField("additional_notes", e.target.value)
                  }
                  disabled={!editMode}
                  style={{ ...inputStyle, minHeight: 120 }}
                />
              </div>
            </div>

            <h3>🛠️ Highlights</h3>

            {aiData.highlights?.length > 0 ? (
              aiData.highlights.map((h: string, i: number) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {editMode ? (
                    <input
                      value={h}
                      onChange={(e) => {
                        const arr = [...aiData.highlights];
                        arr[i] = e.target.value;
                        updateField("highlights", arr);
                      }}
                      style={inputStyle}
                    />
                  ) : (
                    <p>✅ {h}</p>
                  )}
                </div>
              ))
            ) : (
              <p>Ei highlight-tietoja.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}