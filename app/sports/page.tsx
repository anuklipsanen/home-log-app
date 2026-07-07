"use client";

import { useEffect, useMemo, useState } from "react";
import { getSportType } from "@/lib/sportTypes";
import { useRouter, useSearchParams } from "next/navigation";

export default function SportsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

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

  /* 🔥 FIX: ei enää jumita */
  useEffect(() => {
    if (!selectedId) {
      setSelectedActivity(null);
      return;
    }

    if (activities.length === 0) return;

    const found = activities.find((a) => a.id === selectedId);

    setSelectedActivity(found || null);

    if (found) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedId, activities]);

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

  byType: {}, // 👈 uusi
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

    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, val]) => ({
        ...val,
        anu_km: Number(val.anu_km.toFixed(1)),
        onski_km: Number(val.onski_km.toFixed(1)),
      }));
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
            router.push("/sports");
          }}
          onClose={() => {
  setSelectedActivity(null);
  router.push("/sports");
}}
        />
      )}

      <div className="space-y-4">
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

<div className="grid grid-cols-3 gap-2 text-sm mb-4 bg-gray-800 p-3 rounded">
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
  <div className="text-center">{formatHours(m.anu_time)}</div>
  <div className="text-center">{formatHours(m.onski_time)}</div>
</div>

            {openMonth === m.key && (
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
                        onClick={() => {
                          if (selectedId === a.id) {
                            router.push("/sports");
                          } else {
                            router.push(`/sports?id=${a.id}`);
                          }
                        }}
                        className={`border p-3 rounded cursor-pointer transition ${
                          selectedId === a.id
                            ? "bg-blue-900 border-blue-500"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex gap-2 items-center">
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
                          {((a.distance_meters ?? 0) / 1000).toFixed(1)} km ·{" "}
                          {formatDuration(a.duration_seconds)} ·{" "}
                          {a.calories} kcal
                        </div>

                        {a.notes && (
                          <div className="text-sm text-gray-400">
                            {a.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

/* ---------------- EDITABLE ---------------- */

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
}){
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(activity.title);
  const [notes, setNotes] = useState(activity.notes || "");

  /* 🔥 tärkeä fix */
  useEffect(() => {
    setTitle(activity.title);
    setNotes(activity.notes || "");
  }, [activity]);

  async function save() {
    const res = await fetch("/api/sports/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: activity.id, title, notes }),
    });

    const data = await res.json();
    if (!data.success) return alert(data.error);

    onUpdated({ ...activity, title, notes });
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
    <div className="border p-4 rounded bg-blue-950/40 space-y-3">
      <div className="flex justify-between">
        <span className="text-blue-400 text-sm">Valittu suoritus</span>
        <button onClick={onClose} className="text-gray-400 text-sm">
          Sulje
        </button>
      </div>

      <div className="text-sm text-gray-400">
        {formatDate(activity.start_time)}
      </div>

      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full rounded"
        />
      ) : (
        <div className="font-bold text-lg">{activity.title}</div>
      )}

      <div>
        {((activity.distance_meters ?? 0) / 1000).toFixed(1)} km ·{" "}
        {formatDuration(activity.duration_seconds)} ·{" "}
        {activity.calories} kcal
      </div>

      {editing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 w-full rounded"
        />
      ) : (
        activity.notes && <div>{activity.notes}</div>
      )}

      <div className="flex gap-4">
        {!editing ? (
          <>
            <button onClick={() => setEditing(true)}>Muokkaa</button>
            <button onClick={remove} className="text-red-400">
              Poista
            </button>
          </>
        ) : (
          <>
            <button onClick={save} className="text-green-400">
              Tallenna
            </button>
            <button onClick={() => setEditing(false)}>Peruuta</button>
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

function formatHours(seconds?: number) {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}