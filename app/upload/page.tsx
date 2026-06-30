"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UploadPage() {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  // ✅ UPLOAD + AI
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
        return;
      }

      const url = supabase.storage
        .from("attachments")
        .getPublicUrl(data.path).data.publicUrl;
        setFileUrl(url);

      console.log("Uploaded URL:", url);

      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileUrl: url })
      });

      const json = await res.json();

      try {
        const parsed = JSON.parse(json.parsed);
        
setAiData({
  ...parsed,
  reminder_date: "",
  reminder_text: "",
  event_date:
    parsed.event_date ||
    new Date().toISOString().split("T")[0],
});

        console.log("AI DATA:", parsed);
      } catch (err) {
        console.error("JSON parse error:", err);
      }

    } catch (err) {
      console.error("General error:", err);
    }

    setLoading(false);
  }

  // ✅ FIXED FIELD UPDATE

function updateField(field: string, value: any) {
  setAiData((prev: any) => {
    const updated = {
      ...prev,
      [field]: value,
    };

    console.log("UPDATED aiData:", updated); // ✅ DEBUG

    return updated;
  });
}


  // ✅ SAVE
  async function handleSave() {
  if (!aiData) return;

  const finalDescription =
    aiData.description ||
    aiData.notes_short ||
    aiData.highlights?.[0] ||
    "Huoltotoimenpide";

  const { error } = await supabase.from("events").insert([
    {
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
      file_url: fileUrl
    },
  ]);

  if (error) {
    console.error(error);
    alert("❌ Tallennus epäonnistui");
  } else {
    alert("✅ Tallennettu!");
  }
}
``

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload tiedosto</h1>

      <input type="file" onChange={handleUpload} />

      {loading && <p>⏳ Analysoidaan...</p>}

      {aiData && (
        <>
          {/* ✅ ACTIONS */}
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => setEditMode(!editMode)}>
              ✏️ {editMode ? "Valmis" : "Muokkaa"}
            </button>

            <button onClick={handleSave} style={{ marginLeft: 10 }}>
              💾 Tallenna
            </button>
          </div>

          {/* ✅ KUVAUS */}
          <h2>
  {editMode ? (
    <input
      value={aiData.description || ""}
      placeholder="esim. Sähköremontti keittiössä"
      onChange={(e) =>
        updateField("description", e.target.value)
      }
      style={{ width: "100%", fontSize: 20 }}
    />
  ) : (
    aiData.description || "Ei kuvausta"
  )}
</h2>

          {/* ✅ HUOLLON TYYPPI */}
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

{/* ✅ TAPAHTUMAPÄIVÄ (ENSISIJAINEN) */}
<div>
  <b>Tapahtumapäivä: </b>

  {editMode ? (
    <input
      type="date"
      value={aiData.event_date || ""}
      onChange={(e) =>
        updateField("event_date", e.target.value)
      }
    />
  ) : (
    aiData.event_date || "-"
  )}
</div>

          {/* ✅ PERUSTIEDOT */}
          {[
            ["date", "Päivä"],
            ["due_date", "Eräpäivä"],
            ["company", "Yritys"],
            ["invoice_number", "Laskunumero"],
            ["location", "Kohde"],
            ["total_amount", "Summa"],
            ["vat", "ALV"],
            ["work_amount", "Työn osuus"]
          ].map(([key, label]) => (
            <div key={key}>
              <b>{label}: </b>

              {editMode ? (
                <input
                  value={aiData[key] || ""}
                  onChange={(e) =>
                    updateField(key, e.target.value)
                  }
                />
              ) : (
                `${aiData[key] || "-"}${
                  key.includes("amount") || key === "vat" ? " €" : ""
                }`
              )}
            </div>
          ))}

          {/* ✅ BOOLEAN */}
          <p>
            <b>Kotitalousvähennys:</b>{" "}
            {editMode ? (
              <input
                type="checkbox"
                checked={aiData.is_household_deduction || false}
                onChange={(e) =>
                  updateField(
                    "is_household_deduction",
                    e.target.checked
                  )
                }
              />
            ) : aiData.is_household_deduction ? (
              "✅ Kyllä"
            ) : (
              "❌ Ei"
            )}
          </p>

          {/* ✅ HIGHLIGHTS */}
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

          {/* ✅ YHTEENVETO */}
          <h3>Yhteenveto</h3>
          {editMode ? (
            <textarea
              value={aiData.notes_short || ""}
              onChange={(e) =>
                updateField("notes_short", e.target.value)
              }
            />
          ) : (
            <p>{aiData.notes_short}</p>
          )}

          {/* ✅ LISÄTIEDOT */}
          <h3>Lisätiedot</h3>

          {/* ✅ MUISTUTUS */}
<h3>🔔 Muistutus</h3>

<p>
  <b>Tarkistuspäivä:</b>{" "}
  {editMode ? (
    <input
      type="date"
      value={aiData.reminder_date || ""}
      onChange={(e) =>
        updateField("reminder_date", e.target.value)
      }
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
      onChange={(e) =>
        updateField("reminder_text", e.target.value)
      }
    />
  ) : (
    aiData.reminder_text || "-"
  )}
</p>

          {editMode ? (
            <textarea
              value={aiData.additional_notes || ""}
              onChange={(e) =>
                updateField(
                  "additional_notes",
                  e.target.value
                )
              }
            />
          ) : (
            <pre>{aiData.additional_notes}</pre>
          )}
        </>
      )}
    </div>
  );
}