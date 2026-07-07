"use client";

import { useState } from "react";

export default function SportsImportPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMultipleUpload(files: File[]) {
    if (!memberId) {
      alert("Valitse henkilö ensin");
      return;
    }

    setLoading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/sports/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) continue;

      const checkRes = await fetch("/api/sports/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          startTime: data.parsed.startTime,
          duration: Math.round(data.parsed.durationSeconds ?? 0),
        }),
      });

      const check = await checkRes.json();

      setActivities((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          parsed: data.parsed,
          title: data.parsed.title,
          notes: "",
          exists: check.exists,
        },
      ]);
    }

    setLoading(false);
  }

  async function saveActivity(a: any) {
    const res = await fetch("/api/sports/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId,
        title: a.title,
        notes: a.notes,
        parsed: a.parsed,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error);
      return;
    }

    setActivities((prev) => prev.filter((x) => x.id !== a.id));
  }

  async function saveAll() {
    if (!memberId) {
      alert("Valitse henkilö");
      return;
    }

    const toSave = activities.filter((a) => !a.exists);

    if (toSave.length === 0) {
      alert("Ei uusia suorituksia");
      return;
    }

    setLoading(true);

    for (const a of toSave) {
      const res = await fetch("/api/sports/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          title: a.title,
          notes: a.notes,
          parsed: a.parsed,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        console.log("Virhe:", data.error);
      }
    }

    alert(`Tallennettu ${toSave.length} suoritusta ✅`);

    setActivities([]);
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
        <option value="f30cb5de-b062-41b9-8e95-270452f943d7">Anu</option>
        <option value="aba7be53-d988-4d70-aa62-67a2148f640f">Onski</option>
      </select>

      {/* 📂 tiedostot */}
      <input
        type="file"
        accept=".fit,.gpx,.tcx"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleMultipleUpload(files);
        }}
      />

      {loading && <div className="text-gray-400">Ladataan...</div>}

      {/* 🔥 BULK SAVE */}
      {activities.length > 0 && (
        <button
          onClick={saveAll}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          Tallenna kaikki ({activities.filter(a => !a.exists).length})
        </button>
      )}

      {/* 🔥 PREVIEW */}
      {activities.map((a) => (
        <div
          key={a.id}
          className={`border p-4 rounded space-y-3 ${
            a.exists ? "border-red-500 bg-red-950/30" : ""
          }`}
        >
          {a.exists && (
            <div className="text-red-400 font-semibold">
              ⚠️ Tämä suoritus on jo tuotu
            </div>
          )}

          <div className="text-sm text-gray-400">
            {formatDate(a.parsed.startTime)}
          </div>

          <div className="font-semibold">
            {formatActivityType(a.parsed.activityType)}{" "}
            {a.parsed.activitySubType
              ? `(${formatActivitySubType(a.parsed.activitySubType)})`
              : ""}
          </div>

          <div className="font-bold text-lg">
            {(a.parsed.distanceMeters / 1000).toFixed(1)} km ·{" "}
            {formatDuration(a.parsed.durationSeconds)}
          </div>

          {a.parsed.avgHeartRate && (
            <div className="text-sm text-gray-400">
              keskisyke {a.parsed.avgHeartRate}
            </div>
          )}

          {/* ✏️ otsikko */}
          <input
            value={a.title}
            onChange={(e) =>
              setActivities((prev) =>
                prev.map((x) =>
                  x.id === a.id ? { ...x, title: e.target.value } : x
                )
              )
            }
            className="border p-2 w-full rounded"
          />

          {/* 📝 notes */}
          <textarea
            value={a.notes}
            onChange={(e) =>
              setActivities((prev) =>
                prev.map((x) =>
                  x.id === a.id ? { ...x, notes: e.target.value } : x
                )
              )
            }
            className="border p-2 w-full rounded"
            placeholder="Lisätiedot..."
          />

          {/* 🔥 NAPIT */}
          <div className="flex gap-2">
            {!a.exists && (
              <button
                onClick={() => saveActivity(a)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Tallenna
              </button>
            )}

            <button
              onClick={() =>
                setActivities((prev) =>
                  prev.filter((x) => x.id !== a.id)
                )
              }
              className="bg-gray-600 text-white px-3 py-1 rounded"
            >
              Hylkää
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}

/* HELPERS */

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityType(type?: string) {
  switch (type) {
    case "cycling":
      return "Pyöräily";
    case "running":
      return "Juoksu";
    case "walking":
      return "Kävely";
    default:
      return "Urheilu";
  }
}

function formatActivitySubType(sub?: string) {
  switch (sub) {
    case "mountain":
      return "maasto";
    case "road":
      return "maantie";
    default:
      return sub || "";
  }
}