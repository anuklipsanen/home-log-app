"use client";

import { useEffect, useMemo, useState } from "react";

export default function SportsDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [memberFilter, setMemberFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const chartData = useMemo(() => {
  const map: Record<string, any> = {};

  activities.forEach((a) => {
    if (!a.start_time) return;

    const d = new Date(a.start_time);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

    if (!map[key]) {
      map[key] = {
        month: formatMonth(key),
        anu_km: 0,
        onski_km: 0,
        anu_kcal: 0,
        onski_kcal: 0,
        anu_time: 0,
        onski_time: 0,
      };
    }

    const km = (a.distance_meters || 0) / 1000;
    const kcal = a.calories || 0;
    const time = a.duration_seconds || 0;

    if (a.member_id === "f30cb5de-b062-41b9-8e95-270452f943d7") {
      map[key].anu_km += km;
      map[key].anu_kcal += kcal;
      map[key].anu_time += time;
    }

    if (a.member_id === "aba7be53-d988-4d70-aa62-67a2148f640f") {
      map[key].onski_km += km;
      map[key].onski_kcal += kcal;
      map[key].onski_time += time;
    }
  });

  return Object.values(map);
}, [activities]);

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

  /* ---------------- FILTERS ---------------- */

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (memberFilter !== "ALL" && a.member_id !== memberFilter) return false;
      if (typeFilter !== "ALL" && a.activity_type !== typeFilter) return false;
      return true;
    });
  }, [activities, memberFilter, typeFilter]);

  /* ---------------- TYPE OPTIONS ---------------- */

  const activityTypes = useMemo(() => {
    const types = new Set<string>();
    activities.forEach((a) => {
      if (a.activity_type) types.add(a.activity_type);
    });
    return Array.from(types);
  }, [activities]);

  /* ---------------- GROUP BY MONTH ---------------- */

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};

    filtered.forEach((a) => {
      if (!a.start_time) return;

      const d = new Date(a.start_time);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    return map;
  }, [filtered]);

  /* ---------------- SUMMARY ---------------- */

  function getSummary(list: any[]) {
    const totalKm =
      list.reduce((sum, a) => sum + (a.distance_meters || 0), 0) / 1000;

    const totalKcal = list.reduce(
      (sum, a) => sum + (a.calories || 0),
      0
    );

    return {
      km: totalKm.toFixed(1),
      kcal: totalKcal,
      count: list.length,
    };
  }

  return (
    <main className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Urheiluyhteenveto</h1>

     <div className="mt-4">
  <h2 className="text-lg font-semibold mb-2">
    Kuukausittainen liikunta
  </h2>

<div className="grid grid-cols-2 gap-4 mt-4">
  {chartData.map((m: any) => (
    <div key={m.month} className="border p-3 rounded bg-gray-900">
      <div className="font-semibold">{m.month}</div>

      <div className="mt-2 text-sm">
        <div>
          <b>Anu:</b> {m.anu_km.toFixed(1)} km · {m.anu_kcal} kcal ·{" "}
          {formatDuration(m.anu_time)}
        </div>

        <div>
          <b>Onski:</b> {m.onski_km.toFixed(1)} km · {m.onski_kcal} kcal ·{" "}
          {formatDuration(m.onski_time)}
        </div>
      </div>
    </div>
  ))}
</div>
  
</div> 

      {/* ---------------- FILTERS ---------------- */}

      <div className="flex gap-2">
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ALL">Kaikki</option>
          <option value="f30cb5de-b062-41b9-8e95-270452f943d7">
            Anu
          </option>
          <option value="aba7be53-d988-4d70-aa62-67a2148f640f">
            Onski
          </option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ALL">Kaikki lajit</option>
          {activityTypes.map((t) => (
            <option key={t} value={t}>
              {formatType(t)}
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Ladataan...</div>}

      {/* ---------------- MONTHS ---------------- */}

      {Object.entries(grouped).map(([key, list]) => {
        const summary = getSummary(list);

        return (
          <div key={key} className="border rounded p-4 space-y-2">
            <div
              className="cursor-pointer"
              onClick={() =>
                setExpandedMonth(expandedMonth === key ? null : key)
              }
            >
              <div className="font-bold text-lg">
                {formatMonth(key)}
              </div>

              <div className="text-sm text-gray-400">
                {summary.count} suoritusta · {summary.km} km ·{" "}
                {summary.kcal} kcal
              </div>
            </div>

            {/* 🔥 EXPAND */}
            {expandedMonth === key && (
              <div className="space-y-2 mt-3">
                {list.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}

/* ---------------- CARD ---------------- */

function ActivityCard({ activity }: { activity: any }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(activity.title || "");
  const [notes, setNotes] = useState(activity.notes || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);

    const res = await fetch("/api/sports/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: activity.id,
        title,
        notes,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      alert(data.error);
      return;
    }

    setEditing(false);
  }

  return (
    <div className="border p-3 rounded bg-gray-900 space-y-2">
      <div className="text-sm text-gray-400">
        {formatDate(activity.start_time)}
      </div>

      {/* TITLE */}
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-1 w-full rounded"
        />
      ) : (
        <div className="font-semibold">{activity.title}</div>
      )}

      {/* DATA */}
      <div>
        {activity.distance_meters
          ? `${(activity.distance_meters / 1000).toFixed(1)} km`
          : ""}{" "}
        · {formatDuration(activity.duration_seconds)} ·{" "}
        {activity.calories ?? 0} kcal
      </div>

      {/* NOTES */}
      {editing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-1 w-full rounded"
        />
      ) : (
        activity.notes && <div className="text-sm">{activity.notes}</div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-2">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-400"
          >
            Muokkaa
          </button>
        ) : (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="text-sm text-green-400"
            >
              {saving ? "Tallennetaan..." : "Tallenna"}
            </button>

            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-400"
            >
              Peruuta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function formatType(t?: string) {
  switch (t) {
    case "cycling":
      return "Pyöräily";
    case "running":
      return "Juoksu";
    case "walking":
      return "Kävely";
    default:
      return t || "Urheilu";
  }
}

function formatMonth(key: string) {
  const [y, m] = key.split("-");

  const date = new Date(Number(y), Number(m) - 1);

  const str = date.toLocaleDateString("fi-FI", {
    month: "long",
    year: "numeric",
  });

  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString?: string) {
  if (!dateString) return "";

  const d = new Date(dateString);

  const weekday = d.toLocaleDateString("fi-FI", {
    weekday: "short",
  });

  const date = d.toLocaleDateString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${weekday} ${date} klo ${time}`;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h === 0) {
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}