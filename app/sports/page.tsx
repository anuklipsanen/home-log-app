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
          byType: {},
        };
      }

      const km = (a.distance_meters ?? 0) / 1000;
      const kcal = a.calories ?? 0;
      const time = a.duration_seconds ?? 0;
      const type = a.activity_type || "other";

      if (!map[key].byType[type]) {
        map[key].byType[type] = {
          anu: { km: 0, kcal: 0, time: 0 },
          onski: { km: 0, kcal: 0, time: 0 },
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
      }

      if (isOnski) {
        map[key].onski_km += km;
        map[key].onski_kcal += kcal;
        map[key].onski_time += time;

        map[key].byType[type].onski.km += km;
        map[key].byType[type].onski.kcal += kcal;
        map[key].byType[type].onski.time += time;
      }
    });

    return Object.values(map).sort((a: any, b: any) =>
      b.key.localeCompare(a.key)
    );
  }, [activities]);

  useEffect(() => {
    if (chartData.length > 0 && !openMonth) {
      setOpenMonth(chartData[0].key);
    }
  }, [chartData]);

  if (loading) return <div className="p-6">Ladataan...</div>;

  return (
    <main className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Urheiluyhteenveto</h1>

      {/* DETAIL */}
      {selectedActivity && (
        <EditableActivity
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {chartData.map((m: any) => (
        <div key={m.key} className="border p-4 rounded bg-gray-900">
          {/* KUUKAUSI */}
          <div
            className="flex justify-between cursor-pointer mb-3"
            onClick={() =>
              setOpenMonth(openMonth === m.key ? null : m.key)
            }
          >
            <span className="font-semibold text-lg">{m.month}</span>
            <span>{openMonth === m.key ? "▲" : "▼"}</span>
          </div>

          {/* KAIKKI YHTEENSÄ */}
          <SummaryTable
            title="Kaikki yhteensä"
            anu={{
              km: m.anu_km,
              kcal: m.anu_kcal,
              time: m.anu_time,
            }}
            onski={{
              km: m.onski_km,
              kcal: m.onski_kcal,
              time: m.onski_time,
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
                    className="border p-3 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex gap-2">
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

                    <div className="font-semibold">{a.title}</div>

                    <div>
                      {(a.distance_meters / 1000).toFixed(1)} km ·{" "}
                      {formatDuration(a.duration_seconds)} ·{" "}
                      {a.calories} kcal
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
  return (
    <div className="bg-gray-800 p-3 rounded mb-3 text-sm">
      <div className="font-semibold mb-2">{title}</div>

      <div className="grid grid-cols-3">
        <div></div>
        <div className="text-center font-semibold">Anu</div>
        <div className="text-center font-semibold">Onski</div>

        <div>km</div>
        <div className="text-center">{anu.km.toFixed(1)}</div>
        <div className="text-center">{onski.km.toFixed(1)}</div>

        <div>kcal</div>
        <div className="text-center">{anu.kcal}</div>
        <div className="text-center">{onski.kcal}</div>

        <div>aika</div>
        <div className="text-center">{formatHours(anu.time)}</div>
        <div className="text-center">{formatHours(onski.time)}</div>
      </div>
    </div>
  );
}

/* ---------------- EDIT ---------------- */

function EditableActivity({ activity, onClose }: any) {
  return (
    <div className="border p-4 rounded bg-blue-950/40">
      <div className="flex justify-between">
        <span className="text-blue-400">Valittu suoritus</span>
        <button onClick={onClose}>Sulje</button>
      </div>

      <div className="mt-2">{activity.title}</div>
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