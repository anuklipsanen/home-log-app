"use client";

import { useEffect, useMemo, useState } from "react";
import { getSportType, sportTypes } from "@/lib/sportTypes";

export default function SportsDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    const res = await fetch("/api/sports/list", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setActivities(data.activities);
    }

    setLoading(false);
  }

  /* ---------------- DATA ---------------- */

  const chartData = useMemo(() => {
    const map: Record<string, any> = {};

    activities.forEach((a) => {
      if (!a.start_time) return;

      const d = new Date(a.start_time);
      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!map[key]) {
        map[key] = {
          key,
          month: formatMonth(key),
          anu_km: 0,
          onski_km: 0,
          anu_kcal: 0,
          onski_kcal: 0,
          anu_time: 0,
          onski_time: 0,
          anu_hr_sum: 0,
  anu_hr_count: 0,
  onski_hr_sum: 0,
  onski_hr_count: 0,
          byType: {},
        };
      }

      const km = (a.distance_meters ?? 0) / 1000;
      const kcal = a.calories ?? 0;
      const time = a.duration_seconds ?? 0;
      const type = a.activity_type || "other";

      if (!map[key].byType[type]) {
        map[key].byType[type] = {
  anu: { km: 0, kcal: 0, time: 0, hr_sum: 0, hr_count: 0 },
  onski: { km: 0, kcal: 0, time: 0, hr_sum: 0, hr_count: 0 },
};
      }

      const isAnu =
        a.member_id === "f30cb5de-b062-41b9-8e95-270452f943d7";
      const isOnski =
        a.member_id === "aba7be53-d988-4d70-aa62-67a2148f640f";

      if (isAnu) {
        map[key].anu_km += km;
        map[key].anu_kcal += kcal;
        map[key].anu_time += time;
        

        map[key].byType[type].anu.km += km;
        map[key].byType[type].anu.kcal += kcal;
        map[key].byType[type].anu.time += time;

        if (a.avg_heart_rate) {
  map[key].anu_hr_sum += a.avg_heart_rate;
  map[key].anu_hr_count += 1;

  map[key].byType[type].anu.hr_sum += a.avg_heart_rate;
  map[key].byType[type].anu.hr_count += 1;
}
      }

      if (isOnski) {
        map[key].onski_km += km;
        map[key].onski_kcal += kcal;
        map[key].onski_time += time;

        map[key].byType[type].onski.km += km;
        map[key].byType[type].onski.kcal += kcal;
        map[key].byType[type].onski.time += time;
        if (a.avg_heart_rate) {
  map[key].onski_hr_sum += a.avg_heart_rate;
  map[key].onski_hr_count += 1;

  map[key].byType[type].onski.hr_sum += a.avg_heart_rate;
  map[key].byType[type].onski.hr_count += 1;
}
      }
    });

    return Object.values(map).map((m: any) => ({
  ...m,

  anu_hr:
    m.anu_hr_count > 0
      ? Math.round(m.anu_hr_sum / m.anu_hr_count)
      : null,

  onski_hr:
    m.onski_hr_count > 0
      ? Math.round(m.onski_hr_sum / m.onski_hr_count)
      : null,

  byType: Object.fromEntries(
    Object.entries(m.byType).map(([type, d]: any) => [
      type,
      {
        anu: {
          ...d.anu,
          hr:
            d.anu.hr_count > 0
              ? Math.round(d.anu.hr_sum / d.anu.hr_count)
              : null,
        },
        onski: {
          ...d.onski,
          hr:
            d.onski.hr_count > 0
              ? Math.round(d.onski.hr_sum / d.onski.hr_count)
              : null,
        },
      },
    ])
  ),
}));
  }, [activities]);

  useEffect(() => {
    if (chartData.length > 0 && !openMonth) {
      setOpenMonth(chartData[0].key);
    }
  }, [chartData]);

  if (loading) return <div className="p-6">Ladataan...</div>;

  return (
    <main className="p-6 space-y-8 max-w-3xl">
      <div className="flex justify-between items-start gap-4 flex-wrap">
  <div>
    <h1 className="text-2xl font-bold">Urheiluyhteenveto</h1>

    <div className="text-sm text-gray-400 mt-1">
      Voit ladata urheilusuorituksia tiedostoista (esim. Garmin, Strava).
      Tuettu formaatti: .fit, .gpx, .tcx (jopa .zip)
    </div>
  </div>

  <a
    href="/sports/import"
    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded whitespace-nowrap"
  >
    📤 Lataa tiedostoja
  </a>
</div>

      {/* DETAIL */}
      {selectedActivity && (
        <EditableActivity
  activity={selectedActivity}
  onUpdated={(updated) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedActivity(updated);
  }}
  onDeleted={(id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSelectedActivity(null);
  }}
  onClose={() => setSelectedActivity(null)}
/>
      )}

      {chartData.map((m: any) => (
        <div key={m.key} className="rounded-2xl p-4 bg-gray-900/60 border border-gray-800">
          {/* KUUKAUSI */}
          <div
            className="flex justify-between cursor-pointer mb-3"
            onClick={() =>
              setOpenMonth(openMonth === m.key ? null : m.key)
            }
          >
            <span className="font-semibold text-lg tracking-wide">
  {m.month}
</span>
            <span>{openMonth === m.key ? "▲" : "▼"}</span>
          </div>

          {/* KAIKKI YHTEENSÄ */}
          <SummaryTable
            title="Kaikki yhteensä"
            anu={{
  km: m.anu_km,
  kcal: m.anu_kcal,
  time: m.anu_time,
  hr: m.anu_hr,
}}
onski={{
  km: m.onski_km,
  kcal: m.onski_kcal,
  time: m.onski_time,
  hr: m.onski_hr,
}}
          />

          {/* LAJIT */}
          {Object.entries(m.byType)
            .filter(([_, d]: any) => {
              const total =
                d.anu.km +
                d.onski.km +
                d.anu.kcal +
                d.onski.kcal +
                d.anu.time +
                d.onski.time;

              return total > 0;
            })
            .map(([type, data]: any) => {
              const sport = getSportType(type);

              return (
                <SummaryTable
                  key={type}
                  title={`${sport.emoji} ${sport.label}`}
                  anu={data.anu}
                  onski={data.onski}
                />
              );
            })}

          {/* EVENTS */}
          {openMonth === m.key &&
            activities
              .filter((a) => {
                const d = new Date(a.start_time);
                const key = `${d.getFullYear()}-${String(
                  d.getMonth() + 1
                ).padStart(2, "0")}`;
                return key === m.key;
              })
              .map((a) => {
                const sport = getSportType(a.activity_type);

                return (
                  <div
  key={a.id}
  onClick={() =>
    setSelectedActivity(
      selectedActivity?.id === a.id ? null : a
    )
  }
  className="rounded-xl mb-2 overflow-hidden border border-gray-700 hover:border-gray-500 transition cursor-pointer"
>
  <div
    className="p-3"
    style={{
      borderLeft: `4px solid ${sport.color}`,
    }}
  >
    <div className="flex gap-2 items-center text-sm text-gray-400">
      <span>{sport.emoji}</span>
      <span>{sport.label}</span>
    </div>

    <div className="text-xs text-gray-500">
      {formatDate(a.start_time)}
    </div>

    <div className="font-semibold text-base">
      {a.title}
    </div>

    <div className="text-sm text-gray-300">
      {(a.distance_meters / 1000).toFixed(1)} km ·{" "}
      {formatDuration(a.duration_seconds)} ·{" "}
      {a.calories} kcal
    </div>
  </div>
</div>
                );
              })}
        </div>
      ))}
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function SummaryTable({ title, anu, onski }: any) {
  const isTotal = title === "Kaikki yhteensä";
<div className="mb-3 flex items-center gap-2">
  <span className="text-lg font-semibold tracking-wide">
    {title}
  </span>
</div>
  return (
    
    <div className="rounded-xl p-4 mb-4 bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/30">

  {/* HEADER */}
  <div className="grid grid-cols-3 mb-3 items-center">
    <div></div>

    <div className="text-center">
      <div className="inline-block px-3 py-1 rounded-lg bg-blue-600/20 text-green-500 font-semibold text-sm">
        Anu
      </div>
    </div>

    <div className="text-center">
      <div className="inline-block px-3 py-1 rounded-lg bg-purple-600/20 text-blue-500 font-semibold text-sm">
        Onski
      </div>
    </div>
  </div>

  {/* DATA */}
  <div className="grid grid-cols-3 gap-y-3 items-center text-sm">

    {/* KM */}
<div className="flex items-center gap-2 w-24 text-blue-400">
  <span className="w-5 text-center">📏</span>
  <span>km</span>
</div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {anu.km.toFixed(1)}
    </div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {onski.km.toFixed(1)}
    </div>

    {/* KCAL */}
<div className="flex items-center gap-2 w-24 text-orange-400">
  <span className="w-5 text-center">🔥</span>
  <span>kcal</span>
</div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {anu.kcal}
    </div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {onski.kcal}
    </div>

    {/* AIKA */}
<div className="flex items-center gap-2 w-24 text-yellow-400">
  <span className="w-5 text-center">⏱</span>
  <span>aika</span>
</div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {formatHours(anu.time)}
    </div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {formatHours(onski.time)}
    </div>

    {/* SYKE */}
    <div className="flex items-center gap-2 w-24 text-red-400">
  <span className="w-5 text-center">❤️</span>
  <span>syke</span>
</div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {anu.hr ? `${anu.hr} bpm` : "-"}
    </div>
    <div className="text-center text-2xl font-bold tracking-tight tabular-nums">
      {onski.hr ? `${onski.hr} bpm` : "-"}
    </div>

  </div>
</div>
  );
}

/* ---------------- EDIT ---------------- */

function EditableActivity({
  activity,
  onUpdated,
  onDeleted,
  onClose,
}: {
  activity: any;
  onUpdated: (a: any) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState(activity.title);
  const [notes, setNotes] = useState(activity.notes || "");
  const [distance, setDistance] = useState(
    activity.distance_meters || 0
  );
  const [duration, setDuration] = useState(
    activity.duration_seconds || 0
  );
  const [calories, setCalories] = useState(
    activity.calories || 0
  );
  const [type, setType] = useState(
    activity.activity_type || "other"
  );

  useEffect(() => {
    setTitle(activity.title);
    setNotes(activity.notes || "");
    setDistance(activity.distance_meters || 0);
    setDuration(activity.duration_seconds || 0);
    setCalories(activity.calories || 0);
    setType(activity.activity_type || "other");
  }, [activity]);

  const sport = getSportType(type);

  async function save() {
    const res = await fetch("/api/sports/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: activity.id,
        title,
        notes,
        distance_meters: distance,
        duration_seconds: duration,
        calories,
        activity_type: type,
      }),
    });

    const data = await res.json();
    if (!data.success) return alert(data.error);

    onUpdated({
      ...activity,
      title,
      notes,
      distance_meters: distance,
      duration_seconds: duration,
      calories,
      activity_type: type,
    });

    setEditing(false);
  }

  async function remove() {
    if (!confirm("Poistetaanko suoritus?")) return;

    const res = await fetch("/api/sports/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: activity.id }),
    });

    const data = await res.json();
    if (!data.success) return alert(data.error);

    onDeleted(activity.id);
  }

  return (
    <div className="border p-4 rounded bg-blue-950/40 space-y-4">
      <div className="flex justify-between">
        <span className="text-blue-400">Valittu suoritus</span>
        <button onClick={onClose}>Sulje</button>
      </div>

      <div className="text-sm text-gray-400">
        {formatDate(activity.start_time)}
      </div>

      {/* VIEW */}
      {!editing && (
        <>
          <div className="flex gap-2">
            <span style={{ color: sport.color }}>{sport.emoji}</span>
            {sport.label}
          </div>

          <div className="font-bold text-lg">{activity.title}</div>

          <div>
            {(distance / 1000).toFixed(1)} km ·{" "}
            {formatDuration(duration)} · {calories} kcal
          </div>

          {notes && <div>{notes}</div>}
        </>
      )}

      {/* EDIT */}
      {editing && (
  <div className="space-y-4">

    {/* LAJI */}
    <div>
      <label className="text-sm text-gray-400">Laji</label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 w-full rounded bg-gray-900"
      >
        {Object.entries(sportTypes).map(([key, val]: any) => (
          <optgroup key={key} label={`${val.emoji} ${val.label}`}>
            {!val.children && (
              <option value={key}>{val.label}</option>
            )}
            {val.children &&
              Object.entries(val.children).map(
                ([subKey, subLabel]: any) => (
                  <option key={subKey} value={subKey}>
                    {subLabel}
                  </option>
                )
              )}
          </optgroup>
        ))}
      </select>
    </div>

    {/* OTSIKKO */}
    <div>
      <label className="text-sm text-gray-400">Otsikko</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full rounded"
      />
    </div>

    {/* MATKA */}
    <div>
      <label className="text-sm text-gray-400">
        Matka (metriä)
      </label>
      <input
        type="number"
        value={distance}
        onChange={(e) => setDistance(Number(e.target.value))}
        className="border p-2 w-full rounded"
      />
    </div>

    {/* KESTO */}
    <div>
      <label className="text-sm text-gray-400">
        Kesto (sekuntia)
      </label>
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="border p-2 w-full rounded"
      />
    </div>

    {/* KCAL */}
    <div>
      <label className="text-sm text-gray-400">
        Kalorit
      </label>
      <input
        type="number"
        value={calories}
        onChange={(e) => setCalories(Number(e.target.value))}
        className="border p-2 w-full rounded"
      />
    </div>

    {/* NOTES */}
    <div>
      <label className="text-sm text-gray-400">
        Muistiinpanot
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border p-2 w-full rounded"
      />
    </div>

  </div>
)}

      <div className="flex gap-3">
        {!editing ? (
          <>
            <button onClick={() => setEditing(true)}>
              Muokkaa
            </button>
            <button onClick={remove} className="text-red-400">
              Poista
            </button>
          </>
        ) : (
          <>
            <button onClick={save} className="text-green-400">
              Tallenna
            </button>
            <button onClick={() => setEditing(false)}>
              Peruuta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("fi-FI", {
    month: "long",
    year: "numeric",
  });
}

function formatHours(seconds?: number) {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h} h ${m} min`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.toLocaleDateString("fi-FI")} ${d.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}