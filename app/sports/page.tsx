"use client";

import { useEffect, useMemo, useState } from "react";
import { getSportType } from "@/lib/sportTypes";
import { useRouter, useSearchParams } from "next/navigation";

export default function SportsDashboard() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!selectedId || activities.length === 0) return;

    const found = activities.find((a) => a.id === selectedId);

    if (found) {
      setSelectedActivity(found);

      // 🔥 scroll ylös
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedId, activities]);

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

  /* 🔥 avaa uusin kuukausi */
  useEffect(() => {
    if (chartData.length > 0 && !openMonth) {
      setOpenMonth(chartData[0].key);
    }
  }, [chartData]);

  if (loading) return <div className="p-6">Ladataan...</div>;

  return (
    <main className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Urheiluyhteenveto</h1>

      {/* 🔥 SELECTED ACTIVITY (OIKEASSA PAIKASSA) */}
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

      // 🔥 siivoa URL
      router.push("/sports");
    }}
  />
)}

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
              <div
                className="font-semibold text-lg mb-3 cursor-pointer flex justify-between"
                onClick={() =>
                  setOpenMonth(openMonth === m.key ? null : m.key)
                }
              >
                {m.month}
                <span>{openMonth === m.key ? "▲" : "▼"}</span>
              </div>

              {winner && (
                <div className="text-xs text-yellow-400 mb-3">
                  🏆 {winner} johti tässä kuussa
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-sm mb-4 bg-gray-800 p-3 rounded">
                <div></div>
                <div className="text-center font-semibold">Anu</div>
                <div className="text-center font-semibold">Onski</div>

                <div>km</div>
                <div className="text-center">{m.anu_km}</div>
                <div className="text-center">{m.onski_km}</div>

                <div>kcal</div>
                <div className="text-center">{m.anu_kcal}</div>
                <div className="text-center">{m.onski_kcal}</div>

                <div>aika</div>
                <div className="text-center">
                  {formatHours(m.anu_time)}
                </div>
                <div className="text-center">
                  {formatHours(m.onski_time)}
                </div>
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
                          onClick={() =>
                            router.push(`/sports?id=${a.id}`)
                          }
                          className={`border p-3 rounded cursor-pointer transition active:scale-[0.99] ${
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

                          <div className="font-semibold">
                            {a.title}
                          </div>

                          <div>
                            {((a.distance_meters ?? 0) / 1000).toFixed(1)} km ·{" "}
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
              )}
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

function EditableActivity({
  activity,
  onUpdated,
  onDeleted,
}: {
  activity: any;
  onUpdated: (a: any) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(activity.title);
  const [notes, setNotes] = useState(activity.notes || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    onUpdated({
      ...activity,
      title,
      notes,
    });

    setEditing(false);
  }

  async function remove() {
    if (!confirm("Poistetaanko suoritus?")) return;

    setDeleting(true);

    const res = await fetch("/api/sports/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: activity.id,
      }),
    });

    const data = await res.json();
    setDeleting(false);

    if (!data.success) {
      alert(data.error);
      return;
    }

    onDeleted(activity.id);
  }

  return (
    <div className="border p-4 rounded bg-blue-950/40 mb-4 space-y-3">
      <div className="text-xs text-blue-400">
        Valittu suoritus
      </div>

      <div className="text-sm text-gray-400">
        {formatDate(activity.start_time)}
      </div>

      {/* TITLE */}
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full rounded"
        />
      ) : (
        <div className="font-bold text-lg">{activity.title}</div>
      )}

      {/* DATA */}
      <div>
        {((activity.distance_meters ?? 0) / 1000).toFixed(1)} km ·{" "}
        {formatDuration(activity.duration_seconds)} ·{" "}
        {activity.calories} kcal
      </div>

      {/* NOTES */}
      {editing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 w-full rounded"
        />
      ) : (
        activity.notes && <div className="text-sm">{activity.notes}</div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-4">
        {!editing ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-400"
            >
              Muokkaa
            </button>

            <button
              onClick={remove}
              disabled={deleting}
              className="text-sm text-red-400"
            >
              {deleting ? "Poistetaan..." : "Poista"}
            </button>
          </>
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