"use client";

import { useState } from "react";

export default function SportsImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file || !memberId) {
      alert("Valitse henkilö ja tiedosto");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("memberId", memberId);
    formData.append("title", title);
    formData.append("notes", notes);

    const res = await fetch("/api/sports/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="p-6 space-y-4 max-w-xl">
      <h1 className="text-xl font-bold">Urheilusuorituksen tuonti</h1>

      {/* 👤 henkilö */}
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="">Valitse henkilö</option>
        <option value="ANU_UUID">Anu</option>
        <option value="ONSKI_UUID">Onski</option>
      </select>

      {/* 📂 tiedosto */}
      <input
        type="file"
        accept=".fit,.gpx,.tcx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {/* ✏️ otsikko */}
      <input
        type="text"
        placeholder="Otsikko (esim. Aamulenkki)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded w-full"
      />

      {/* 📝 lisätiedot */}
      <textarea
        placeholder="Lisätiedot (fiilis, sää, tms.)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border p-2 rounded w-full"
      />

      {/* 🚀 nappi */}
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Tuodaan..." : "Tuo suoritus"}
      </button>

      {/* 📊 debug */}
      {result && (
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}