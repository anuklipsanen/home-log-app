"use client";

import { useEffect, useMemo, useState } from "react";

export default function SportsDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [memberFilter, setMemberFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    const res = await fetch("/api/sports/list");
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
      const d = new Date(a.start_time);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    return map;
  }, [filtered]);

  /* ---------------- SUMMARY ---------------- */

  function getSummary(list: any[]) {
    const totalKm = list.reduce((sum, a) => sum + (a.distance_meters || 0), 0) / 1000;
    const totalKcal = list.reduce((sum, a) => sum + (a.calories || 0), 0);
    return {
      km: totalKm.toFixed(1),
      kcal: totalKcal,
      count: list.length,
    };
  }

  return (
    <main className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Urheiluyhteenveto</h1>

      {/* ---------------- FILTERS ---------------- */}

      <div className="flex gap-2">
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ALL">Kaikki</option>
          <option value="f30cb5de-b062-41b9-8e95-270452f943d7">Anu</option>
          <option value="aba7be53-d988-4d70-aa62-67a2148f640f">Onski</option>
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
                {summary.count} suoritusta · {summary.km} km · {summary.kcal} kcal
              </div>
            </div>

            {/* 🔥 EXPAND */}
            {expandedMonth === key && (
              <div className="space-y-2 mt-3">
                {list.map((a) => (
                  <div key={a.id} className="border p-3 rounded bg-gray-900">
                    <div className="text-sm text-gray-400">
                      {formatDate(a.start_time)}
                    </div>

                    <div className="font-semibold">
                      {a.title}
                    </div>

                    <div>
                      {(a.distance_meters / 1000).toFixed(1)} km ·{" "}
                      {formatDuration(a.duration_seconds)} ·{" "}
                      {a.calories} kcal
                    </div>

                    {a.notes && (
                      <div className="text-sm">{a.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </main>
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
      return t;
  }
}

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  return `${m}.${y}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "";

  const d = new Date(dateString);

  if (isNaN(d.getTime())) return "";

  return d.toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}