"use client";

import { useEffect, useState } from "react";

export default function SportsDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    try {
      const res = await fetch("/api/sports/list");
      const data = await res.json();

      if (data.success) {
        setActivities(data.activities);
      } else {
        console.error("API error:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }

    setLoading(false);
  }

  return (
    <main className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Urheilusuoritukset</h1>

      {loading && <div className="text-gray-400">Ladataan...</div>}

      {!loading && activities.length === 0 && (
        <div className="text-gray-400">Ei suorituksia vielä</div>
      )}

      {activities.map((a) => (
        <div
          key={a.id}
          className="border p-4 rounded space-y-2 bg-gray-900"
        >
          {/* 👤 henkilö */}
          <div className="text-sm text-gray-400">
            {getMemberName(a.member_id)}
          </div>

          {/* 📅 aika */}
          <div className="text-sm text-gray-400">
            {formatDate(a.start_time)}
          </div>

          {/* 🏷️ otsikko */}
          <div className="font-semibold text-lg">
            {a.title}
          </div>

          {/* 📏 matka + aika + kcal */}
          <div className="font-bold">
            {(a.distance_meters / 1000).toFixed(1)} km ·{" "}
            {formatDuration(a.duration_seconds)}
            {a.calories ? ` · ${a.calories} kcal` : ""}
          </div>

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

/* ---------------- HELPERS ---------------- */

function getMemberName(id: string) {
  if (id === "f30cb5de-b062-41b9-8e95-270452f943d7") return "Anu";
  if (id === "aba7be53-d988-4d70-aa62-67a2148f640f") return "Onski";
  return "Tuntematon";
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

function formatDate(dateString?: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}