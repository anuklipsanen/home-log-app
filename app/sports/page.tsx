"use client";

import { useEffect, useState } from "react";

export default function SportsDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Urheilusuoritukset</h1>

      {loading && <div>Ladataan...</div>}

      {!loading && activities.length === 0 && (
        <div className="text-gray-400">
          Ei suorituksia vielä
        </div>
      )}

      {activities.map((a) => (
        <div
          key={a.id}
          className="border p-4 rounded space-y-2 bg-gray-900"
        >
          {/* 👤 henkilö */}
          <div className="text-sm text-gray-400">
            {a.household_members?.name ?? "Tuntematon"}
          </div>

          {/* 📅 aika */}
          <div className="text-sm text-gray-400">
            {formatDate(a.start_time)}
          </div>

          {/* 🏷️ otsikko */}
          <div className="font-semibold text-lg">
            {a.title}
          </div>

          {/* 📏 data */}
          <div className="font-bold">
  {(a.distance_meters / 1000).toFixed(1)} km ·{" "}
  {formatDuration(a.duration_seconds)}
</div>

{a.calories && (
  <div className="text-sm text-gray-400">
    {a.calories} kcal
  </div>
)}

          {/* ❤️ syke */}
          {a.avg_heart_rate && (
            <div className="text-sm text-gray-400">
              keskisyke {a.avg_heart_rate}
            </div>
          )}

          {/* 📝 notes */}
          {a.notes && (
            <div className="text-sm">
              {a.notes}
            </div>
          )}
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