import { sportKeywordMap } from "./sportKeywordMap";

/* ---------------- MAIN ---------------- */

export function detectSportType(a: any): string {
  const text = `${a.title || ""} ${a.name || ""}`.toLowerCase();

  /* 🐶 KOIRA-DETECT (ENSIMMÄISENÄ) */

  if (
    text.includes("dog") ||
    text.includes("koira") ||
    text.includes("canicross") ||
    text.includes("bikejoring")
  ) {
    const speed = getAvgSpeed(a);

    // 🚴 koirapyöräily
    if (speed > 10) return "cycling_dog";

    // 🏃 koirajuoksu
    return "running_dog";
  }

  /* ---------------- 1. DEVICE DATA (TÄRKEIN) ---------------- */

  const type = (a.activityType || "").toLowerCase();
  const sub = (a.activitySubType || "").toLowerCase();

  const deviceMatch = mapDeviceType(type, sub);
  if (deviceMatch) return deviceMatch;

  /* ---------------- 2. KEYWORD MATCH ---------------- */

  for (const [key, keywords] of Object.entries(sportKeywordMap)) {
    if (keywords.some((k) => text.includes(k))) {
      return key;
    }
  }

  /* ---------------- 3. METRICS ---------------- */

  const metricMatch = detectFromMetrics(a);
  if (metricMatch) return metricMatch;

  return "other";
}

/* ---------------- DEVICE MAPPING ---------------- */

function mapDeviceType(type: string, sub: string): string | null {
  // 🚴 cycling
  if (type.includes("cycl") || type.includes("bike")) {
    if (sub.includes("mountain") || sub.includes("mtb")) {
      return "cycling_mtb";
    }
    return "cycling_road";
  }

  // 🏃 running
  if (type.includes("run")) {
    if (sub.includes("trail")) return "running_trail";
    if (sub.includes("interval")) return "running_interval";
    return "running_easy";
  }

  // 🚶 walking
  if (type.includes("walk")) {
    if (sub.includes("hike")) return "walking_hiking";
    return "walking_easy";
  }

  // 🏊
  if (type.includes("swim")) return "swimming";

  // ⛷️
  if (type.includes("ski")) return "skiing";

  // 🏋️
  if (type.includes("gym") || type.includes("workout")) {
    return "gym_strength";
  }

  return null;
}

/* ---------------- METRICS ---------------- */

function detectFromMetrics(a: any): string | null {
  const speed = getAvgSpeed(a);
  const elevation = a.elevationGainMeters ?? 0;

  // 🚴 pyöräily
  if (speed > 15) {
    if (elevation > 200) return "cycling_mtb";
    return "cycling_road";
  }

  // 🏃 juoksu
  if (speed > 7) {
    if (elevation > 100) return "running_trail";
    return "running_easy";
  }

  // 🚶 kävely
  if (speed > 3) {
    if (elevation > 100) return "walking_hiking";
    return "walking_easy";
  }

  return null;
}

function getAvgSpeed(a: any) {
  if (!a.distanceMeters || !a.durationSeconds) return 0;

  const km = a.distanceMeters / 1000;
  const h = a.durationSeconds / 3600;

  return km / h;
}