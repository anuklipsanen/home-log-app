"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UploadPage() {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

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
    <div style={{ padding: 20 }}>
      <h1>Upload tiedosto</h1>

      <input type="file" onChange={handleUpload} />

      {loading && <p>⏳ Analysoidaan...</p>}

      {aiData && (
        <>
          <div style={{ marginBottom: 10, marginTop: 20 }}>
            <button onClick={() => setEditMode(!editMode)}>
              ✏️ {editMode ? "Valmis" : "Muokkaa"}
            </button>

            <button onClick={handleSave} style={{ marginLeft: 10 }}>
              💾 Tallenna
            </button>
          </div>

          <h2>
            {editMode ? (
              <input
                value={aiData.description || ""}
                placeholder="esim. Sähköremontti keittiössä"
                onChange={(e) => updateField("description", e.target.value)}
                style={{ width: "100%", fontSize: 20 }}
              />
            ) : (
              aiData.description || "Ei kuvausta"
            )}
          </h2>

          <p>
            <b>Huollon tyyppi:</b>{" "}
            {editMode ? (
              <select
                value={aiData.maintenance_type || ""}
                onChange={(e) =>
                  updateField("maintenance_type", e.target.value)
                }
              >
                <option value="">Valitse</option>
                <option value="nuohous">Nuohous</option>
                <option value="likakaivo">Likakaivo</option>
                <option value="jatehuolto">Sekajäte</option>
                <option value="biojatehuolto">Biojäte</option>
                <option value="suodatin">Suodatin</option>
                <option value="ilp_suodatin">ILP suodatin</option>
                <option value="ilmalämpöpumppu">ILP huolto</option>
                <option value="sähkö">Sähkö</option>
                <option value="vesi">Vesi</option>
                <option value="rakennus">Rakennus</option>
                <option value="muu">Muu</option>
              </select>
            ) : (
              aiData.maintenance_type || "-"
            )}
          </p>

          <div>
            <b>Tapahtumapäivä: </b>

            {editMode ? (
              <input
                type="date"
                value={aiData.event_date || ""}
                onChange={(e) => updateField("event_date", e.target.value)}
              />
            ) : (
              aiData.event_date || "-"
            )}
          </div>

          {[
            ["date", "Päivä"],
            ["due_date", "Eräpäivä"],
            ["company", "Yritys"],
            ["invoice_number", "Laskunumero"],
            ["location", "Kohde"],
            ["total_amount", "Summa"],
            ["vat", "ALV"],
            ["work_amount", "Työn osuus"],
          ].map(([key, label]) => (
            <div key={key}>
              <b>{label}: </b>

              {editMode ? (
                <input
                  value={aiData[key] || ""}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              ) : (
                `${aiData[key] || "-"}${
                  key.includes("amount") || key === "vat" ? " €" : ""
                }`
              )}
            </div>
          ))}

          <p>
            <b>Kotitalousvähennys:</b>{" "}
            {editMode ? (
              <input
                type="checkbox"
                checked={aiData.is_household_deduction || false}
                onChange={(e) =>
                  updateField("is_household_deduction", e.target.checked)
                }
              />
            ) : aiData.is_household_deduction ? (
              "✅ Kyllä"
            ) : (
              "❌ Ei"
            )}
          </p>

          <h3>🔔 Muistutus</h3>

          {editMode && (
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
          )}

          <p>
            <b>Tarkistuspäivä:</b>{" "}
            {editMode ? (
              <input
                type="date"
                value={aiData.reminder_date || ""}
                onChange={(e) => updateField("reminder_date", e.target.value)}
              />
            ) : (
              aiData.reminder_date || "-"
            )}
          </p>

          <p>
            <b>Muistutus:</b>{" "}
            {editMode ? (
              <input
                value={aiData.reminder_text || ""}
                onChange={(e) => updateField("reminder_text", e.target.value)}
                placeholder="Esim. Tarkista suodatin / tilaa huolto"
                style={{ minWidth: 320 }}
              />
            ) : (
              aiData.reminder_text || "-"
            )}
          </p>

          <h3>🛠️ Highlights</h3>
          {aiData.highlights?.map((h: string, i: number) => (
            <div key={i}>
              {editMode ? (
                <input
                  value={h}
                  onChange={(e) => {
                    const arr = [...aiData.highlights];
                    arr[i] = e.target.value;
                    updateField("highlights", arr);
                  }}
                />
              ) : (
                <p>✅ {h}</p>
              )}
            </div>
          ))}

          <h3>Yhteenveto</h3>
          {editMode ? (
            <textarea
              value={aiData.notes_short || ""}
              onChange={(e) => updateField("notes_short", e.target.value)}
            />
          ) : (
            <p>{aiData.notes_short}</p>
          )}

          <h3>Lisätiedot</h3>
          {editMode ? (
            <textarea
              value={aiData.additional_notes || ""}
              onChange={(e) => updateField("additional_notes", e.target.value)}
            />
          ) : (
            <pre>{aiData.additional_notes}</pre>
          )}
        </>
      )}
    </div>
  );
}