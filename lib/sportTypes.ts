export const sportTypes = {
  cycling: {
    label: "Pyöräily",
    emoji: "🚴",
    color: "#22c55e",
  },

  running: {
    label: "Juoksu",
    emoji: "🏃",
    color: "#ef4444",
  },

  walking: {
    label: "Kävely",
    emoji: "🚶",
    color: "#3b82f6",
  },

  other: {
    label: "Muu",
    emoji: "🏋️",
    color: "#a855f7",
  },
} as const;

/* 🔥 TÄMÄ PUUTTUI SINULTA */
export function getSportType(type?: string) {
  if (!type) return sportTypes.other;

  return (
    sportTypes[type as keyof typeof sportTypes] ||
    sportTypes.other
  );
}