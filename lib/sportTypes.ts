export const sportTypes: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  cycling: { label: "Pyöräily", emoji: "🚴", color: "#22c55e" },
  running: { label: "Juoksu", emoji: "🏃", color: "#f97316" },
  walking: { label: "Kävely", emoji: "🚶", color: "#3b82f6" },
  other: { label: "Muu", emoji: "❓", color: "#9ca3af" },
};

export function getSportType(type?: string) {
  if (!type) return sportTypes.other;

  return (
    sportTypes[type] || {
      label: type,
      emoji: "✨",
      color: "#888",
    }
  );
}