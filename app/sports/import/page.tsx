"use client";

import { useState } from "react";
import { detectSportType } from "@/lib/detectSportType";
import { sportTypes, getSportType } from "@/lib/sportTypes";

export default function SportsImportPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: File[]) {
    if (!memberId) {
      alert("Valitse henkilö ensin");
      return;
    }

    setLoading(true);

    for (const file of files) {
      // 🔥 ZIP
      if (file.name.endsWith(".zip")) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/sports/parse-zip", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!data.success) continue;

        for (const parsed of data.activities) {
          await addParsedActivity(parsed);
        }

      } else {
        // 🔹 normaali tiedosto
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/sports/parse", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!data.success) continue;

        await addParsedActivity(data.parsed);
      }
    }

    setLoading(false);
  }

  async function addParsedActivity(parsed: any) {
    const checkRes = await fetch("/api/sports/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId,
        startTime: parsed.startTime,
        duration: Math.round(parsed.durationSeconds ?? 0),
      }),
    });

    const check = await checkRes.json();

    const detectedType = detectSportType(parsed);

setActivities((prev) => [
  ...prev,
  {
    id: crypto.randomUUID(),
    parsed,
    title: check.activity?.title ?? parsed.title,
    notes: check.activity?.notes ?? "",
    exists: check.exists,
    existingId: check.activity?.id ?? null,

    // 🔥 UUSI
    activity_type: detectedType,
    autoDetected: true,
  },
]);
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
        activity_type: a.activity_type,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error);
      return;
    }

    setActivities((prev) => prev.filter((x) => x.id !== a.id));
  }

  async function updateActivity(a: any) {
    const res = await fetch("/api/sports/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: a.existingId,
        title: a.title,
        notes: a.notes,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error);
      return;
    }

    alert("Päivitetty ✅");

    setActivities((prev) => prev.filter((x) => x.id !== a.id));
  }

  async function saveAll() {
    const toSave = activities.filter((a) => !a.exists);

    if (toSave.length === 0) {
      alert("Ei uusia suorituksia");
      return;
    }

    setLoading(true);

    for (const a of toSave) {
      await saveActivity(a);
    }

    alert(`Tallennettu ${toSave.length} suoritusta ✅`);
    setActivities([]);
    setLoading(false);
  }
function SportTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border p-2 w-full rounded bg-gray-900 text-white"
    >
      {Object.entries(sportTypes).map(([parentKey, parent]: any) => (
        <optgroup
          key={parentKey}
          label={`${parent.emoji} ${parent.label}`}
        >
          {/* ilman alatyyppejä */}
          {!parent.children && (
            <option value={parentKey}>
              {parent.emoji} {parent.label}
            </option>
          )}

          {/* alatyyppien kanssa */}
          {parent.children &&
            Object.entries(parent.children).map(
              ([childKey, childLabel]: any) => (
                <option key={childKey} value={childKey}>
                  {parent.emoji} {childLabel}
                </option>
              )
            )}
        </optgroup>
      ))}
    </select>
  );
}

  return (
    <main className="p-6 space-y-4 max-w-xl">
      <h1 className="text-xl font-bold">Urheilusuorituksen tuonti</h1>

      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="">Valitse henkilö</option>
        <option value="f30cb5de-b062-41b9-8e95-270452f943d7">Anu</option>
        <option value="aba7be53-d988-4d70-aa62-67a2148f640f">Onski</option>
      </select>

      <input
        type="file"
        accept=".fit,.gpx,.tcx,.zip"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFiles(files);
        }}
      />

      {loading && <div>Ladataan...</div>}

      {activities.length > 0 && (
        <button
          onClick={saveAll}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          Tallenna kaikki ({activities.filter(a => !a.exists).length})
        </button>
      )}

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

          <div>{formatDate(a.parsed.startTime)}</div>

          <div className="space-y-2">
  {/* 🔥 nykyinen valinta */}
  <div className="flex items-center gap-2">
    <span
      style={{
        color: getSportType(a.activity_type).color,
      }}
    >
      {getSportType(a.activity_type).emoji}
    </span>

    <span>
      {getSportType(a.activity_type).label}
    </span>

    {a.autoDetected && (
      <span className="text-xs text-gray-500">
        (automaattinen)
      </span>
    )}
  </div>

  {/* 🔥 TÄMÄ PUUTTUU SINULTA */}
  <select
    value={a.activity_type}
    onChange={(e) =>
      setActivities((prev) =>
        prev.map((x) =>
          x.id === a.id
            ? {
                ...x,
                activity_type: e.target.value,
                autoDetected: false,
              }
            : x
        )
      )
    }
    className="border p-2 w-full rounded bg-gray-900 text-white"
  >
    {Object.entries(sportTypes).map(([parentKey, parent]: any) => (
      <optgroup
        key={parentKey}
        label={`${parent.emoji} ${parent.label}`}
      >
        {!parent.children && (
          <option value={parentKey}>
            {parent.emoji} {parent.label}
          </option>
        )}

        {parent.children &&
          Object.entries(parent.children).map(
            ([childKey, childLabel]: any) => (
              <option key={childKey} value={childKey}>
                {parent.emoji} {childLabel}
              </option>
            )
          )}
      </optgroup>
    ))}
  </select>
</div>

          <div>
            {(a.parsed.distanceMeters / 1000).toFixed(1)} km ·{" "}
            {formatDuration(a.parsed.durationSeconds)}
          </div>

          <input
            value={a.title}
            onChange={(e) =>
              setActivities((prev) =>
                prev.map((x) =>
                  x.id === a.id ? { ...x, title: e.target.value } : x
                )
              )
            }
          />

          <textarea
            value={a.notes}
            onChange={(e) =>
              setActivities((prev) =>
                prev.map((x) =>
                  x.id === a.id ? { ...x, notes: e.target.value } : x
                )
              )
            }
          />

          <div className="flex gap-2">
            {!a.exists && (
              <button onClick={() => saveActivity(a)}>
                Tallenna
              </button>
            )}

            {a.exists && (
              <button onClick={() => updateActivity(a)}>
                Päivitä
              </button>
            )}

            <button
              onClick={() =>
                setActivities((prev) =>
                  prev.filter((x) => x.id !== a.id)
                )
              }
            >
              Hylkää
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}

/* helpers */

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("fi-FI");
}