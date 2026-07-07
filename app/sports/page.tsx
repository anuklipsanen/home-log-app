"use client";

import { useEffect, useMemo, useState } from "react";
import { getSportType } from "@/lib/sportTypes";
import { useRouter } from "next/navigation";

export default function SportsDashboard() {
  const router = useRouter();

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

      if (a.member_id === "f30cb5de-b062-41b9-8e95-270452f943d7") {
        map[key].anu_km += km;
        map[key].anu_kcal += kcal;
        map[key].anu_time += time;

        map[key].byType[type].anu.km += km;
        map[key].byType[type].anu.kcal += kcal;
        map[key].byType[type].anu.time += time;
      }

      if (a.member_id === "aba7be53-d988-4d70-aa62-67a2148f640f") {
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

      {/* 🔥 DETAIL */}
      {selectedActivity && (
        <EditableActivity
          activity={selectedActivity}
          onUpdated={(updated: any) => {
            setActivities((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
            setSelectedActivity(updated);
          }}
          onDeleted={(id: string) => {
            setActivities((prev) => prev.filter((a) => a.id !== id));
            setSelectedActivity(null);
          }}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {chartData.map((m: any) => (
        <div key={m.key} className="border p-4 rounded bg-gray-900">
          <div
            className="font-semibold text-lg mb-3 cursor-pointer flex justify-between"
            onClick={() =>
              setOpenMonth(openMonth === m.key ? null : m.key)
            }
          >
            {m.month}
            <span>{openMonth === m.key ? "▲" : "▼"}</span>
          </div>

          {/* TOTAL */}
          <div className="grid grid-cols-3 gap-2 text-sm mb-4 bg-gray-800 p-3 rounded">
            <div></div>
            <div className="text-center font-semibold">Anu</div>
            <div className="text-center font-semibold">Onski</div>

            <div>km</div>
            <div className="text-center">{m.anu_km.toFixed(1)}</div>
            <div className="text-center">{m.onski_km.toFixed(1)}</div>

            <div>kcal</div>
            <div className="text-center">{m.anu_kcal}</div>
            <div className="text-center">{m.onski_kcal}</div>

            <div>aika</div>
            <div className="text-center">{formatHours(m.anu_time)}</div>
            <div className="text-center">{formatHours(m.onski_time)}</div>
          </div>

          {/* LAJIT */}
          {Object.entries(m.byType).map(([type, data]: any) => {
            const sport = getSportType(type);

            return (
              <div key={type} className="text-sm mb-2">
                <div>{sport.emoji} {sport.label}</div>
              </div>
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
                    className={`border p-3 rounded cursor-pointer ${
                      selectedActivity?.id === a.id
                        ? "bg-blue-900"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <div>{sport.emoji} {a.title}</div>
                  </div>
                );
              })}
        </div>
      ))}
    </main>
  );
}

/* ---------------- EDITABLE ---------------- */

function EditableActivity({ activity, onUpdated, onDeleted, onClose }: any) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(activity.title);
  const [notes, setNotes] = useState(activity.notes || "");

  useEffect(() => {
    setTitle(activity.title);
    setNotes(activity.notes || "");
  }, [activity]);

  async function save() {
    const res = await fetch("/api/sports/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activity.id, title, notes }),
    });

    const data = await res.json();
    if (!data.success) return alert(data.error);

    onUpdated({ ...activity, title, notes });
    setEditing(false);
  }

  async function remove() {
    if (!confirm("Poistetaanko suoritus?")) return;

    await fetch("/api/sports/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activity.id }),
    });

    onDeleted(activity.id);
  }

  return (
    <div className="border p-4 rounded bg-blue-950/40">
      <button onClick={onClose}>Sulje</button>

      {editing ? (
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      ) : (
        <div>{activity.title}</div>
      )}

      {editing ? (
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      ) : (
        <div>{activity.notes}</div>
      )}

      {!editing ? (
        <>
          <button onClick={() => setEditing(true)}>Muokkaa</button>
          <button onClick={remove}>Poista</button>
        </>
      ) : (
        <>
          <button onClick={save}>Tallenna</button>
          <button onClick={() => setEditing(false)}>Peruuta</button>
        </>
      )}
    </div>
  );
}

/* helpers */
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