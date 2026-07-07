export function normalizeSportType(input?: string) {
  if (!input) return "other";

  const t = input.toLowerCase();

  // 🔥 englanti
  if (t.includes("cycle")) return "cycling";
  if (t.includes("run")) return "running";
  if (t.includes("walk")) return "walking";

  // 🔥 suomi
  if (t.includes("pyör")) return "cycling";
  if (t.includes("juoks")) return "running";
  if (t.includes("kävel")) return "walking";

  return "other";
}