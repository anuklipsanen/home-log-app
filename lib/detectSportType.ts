import { sportKeywordMap } from "./sportKeywordMap";

export function detectSportType(a: any): string {
  const text = `${a.title || ""} ${a.name || ""}`.toLowerCase();

  // 🔥 1. KEYWORD MATCH
  for (const [type, keywords] of Object.entries(sportKeywordMap)) {
    if (keywords.some((k) => text.includes(k))) {
      return type;
    }
  }

  // 🔥 2. DATA BASED FALLBACK
  return detectFromMetrics(a);
}

/* ---------------- FALLBACK ---------------- */

function detectFromMetrics(a: any): string {
  const speed = getAvgSpeed(a);

  if (speed > 15) return "cycling_road";
  if (speed > 10) return "running_easy";
  if (speed > 3) return "walking_easy";

  return "other";
}

function getAvgSpeed(a: any) {
  if (!a.distance_meters || !a.duration_seconds) return 0;

  const km = a.distance_meters / 1000;
  const hours = a.duration_seconds / 3600;

  return km / hours;
}