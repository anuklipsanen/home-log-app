"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UploadPage() {
  const [fileUrl, setFileUrl] = useState("");
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

      if (error) {
        console.error("Upload error:", error);
        setLoading(false);
        return;
      }

      const url = supabase.storage
        .from("attachments")
        .getPublicUrl(data.path).data.publicUrl;

      setFileUrl(url);

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
        setAiData(parsed);
      } catch (err) {
        console.error("JSON parse error:", err);
      }

    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h1>Upload tiedosto</h1>

      <input type="file" onChange={handleUpload} />

      {loading && <p>⏳ Analysoidaan...</p>}

      {/* ✅ Upload */}
      {fileUrl && (
        <div>
          <p>✅ Upload valmis</p>

          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileUrl}
          </a>
        </div>
      )}

      {/* 🤖 AI DATA */}
      {aiData && (
        <div style={{ marginTop: 20 }}>
          <h2>🤖 AI tunnisti</h2>

          {/* ⭐ Tärkeät huomiot */}
          {aiData.highlights?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>⭐ Tärkeät huomiot</h3>
              <ul>
                {aiData.highlights.map((h: string, i: number) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <p><b>Kuvaus:</b> {aiData.description}</p>
          <p><b>Päivä:</b> {aiData.date}</p>
          <p><b>Yritys:</b> {aiData.company}</p>
          <p><b>Summa:</b> {aiData.total_amount} €</p>

          {aiData.additional_notes && (
            <div style={{ marginTop: 20 }}>
              <h3>📄 Lisätiedot</h3>
              <pre>{aiData.additional_notes}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}