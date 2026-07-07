export const sportTypes = {
  cycling: {
    label: "Pyöräily",
    emoji: "🚴",
    color: "#22c55e",
    children: {
      cycling_road: "Maantiepyöräily",
      cycling_mtb: "Maastopyöräily",
      cycling_dog: "Koirapyöräily",
    },
  },

  running: {
    label: "Juoksu",
    emoji: "🏃",
    color: "#f97316",
    children: {
      running_easy: "Hölkkä",
      running_interval: "Intervalli",
      running_trail: "Polkujuoksu",
      running_dog: "Koirajuoksu",
    },
  },

  walking: {
    label: "Kävely",
    emoji: "🚶",
    color: "#3b82f6",
    children: {
      walking_easy: "Hölkkä",
      walking_interval: "Intervalli",
      walking_hiking: "Vaellus",
    },
  },

  volleyball: {
    label: "Lentopallo",
    emoji: "🏐",
    color: "#f43f5e",
  },

  floorball: {
    label: "Salibandy",
    emoji: "🥅",
    color: "#facc15",
  },

  swimming: {
    label: "Uinti",
    emoji: "🏊",
    color: "#60a5fa",
  },

  skiing: {
    label: "Hiihto",
    emoji: "⛷️",
    color: "#8b5cf6",
  },

  rowing: {
    label: "Soutu",
    emoji: "🚣",
    color: "#14b8a6",
  },

  gym: {
    label: "Kuntosali",
    emoji: "🏋️",
    color: "#f97316",
  },

  ice_skating: {
    label: "Luistelu",
    emoji: "⛸️",
    color: "#3b82f6",
  },

  other: {
    label: "Muu",
    emoji: "❓",
    color: "#9ca3af",
  },
};

export function getSportType(type?: string) {
  if (!type) return sportTypes.other;

  for (const [parentKey, parent] of Object.entries(sportTypes) as any) {
    if (parentKey === type) return parent;

    if (parent.children && parent.children[type]) {
      return {
        label: parent.children[type],
        emoji: parent.emoji,
        color: parent.color,
      };
    }
  }

  return {
    label: type,
    emoji: "✨",
    color: "#888",
  };
}