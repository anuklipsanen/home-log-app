"use client";

import { useEffect, useMemo, useState } from "react";
import { getSportType } from "@/lib/sportTypes";

export default function SportsDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  /* ---------------- CHART DATA ---------------- */

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
        };
      }

      const km = (a.distance_meters ?? 0) / 1000;
      const kcal = a.calories ?? 0;
      const time = a.duration_seconds ?? 0;

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

    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, val]) => ({
        ...val,
        anu_km: Number(val.anu_km.toFixed(1)),
        onski_km: Number(val.onski_km.toFixed(1)),
      }));
  }, [activities]);

  if (loading) return <div className="p-6">Ladataan...</div>;

  return (
    <main className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Urheiluyhteenveto</h1>

      {/* 🔥 KUUKAUSIKOHTAINEN YHTEENVETO */}
      <div className="space-y-4">
        {chartData.map((m: any) => {
          const winner =
            m.anu_km > m.onski_km
              ? "Anu"
              : m.onski_km > m.anu_km
              ? "Onski"
              : null;

          return (
            <div
              key={m.key}
              className="border p-4 rounded bg-gray-900"
            >
              {/* 📅 kuukausi */}
              <div className="font-semibold text-lg mb-2">
                {m.month}
              </div>

              {/* 🏆 voittaja */}
              {winner && (
                <div className="text-xs text-yellow-400 mb-3">
                  🏆 {winner} johti tässä kuussa
                </div>
              )}

              {/* 🔥 GRID */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                <div></div>
                <div className="font-semibold text-center">Anu</div>
                <div className="font-semibold text-center">Onski</div>

                <div className="text-gray-400">km</div>
                <div className="text-center">{m.anu_km}</div>
                <div className="text-center">{m.onski_km}</div>

                <div className="text-gray-400">kcal</div>
                <div className="text-center">{m.anu_kcal}</div>
                <div className="text-center">{m.onski_kcal}</div>

                <div className="text-gray-400">aika</div>
                <div className="text-center">
                  {formatHours(m.anu_time)}
                </div>
                <div className="text-center">
                  {formatHours(m.onski_time)}
                </div>
              </div>

              {/* 🔥 TAPAHTUMAT */}
              <div className="space-y-2">
                {activities
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
                        className="border p-3 rounded bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ color: sport.color }}>
                            {sport.emoji}
                          </span>
                          <span className="text-sm text-gray-400">
                            {sport.label}
                          </span>
                        </div>

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
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

/* ---------------- HELPERS ---------------- */

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

function formatHours(seconds?: number) {
  if (!seconds) return "-";

  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;

  return `${h} h ${m} min`;
}