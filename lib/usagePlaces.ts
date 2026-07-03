export const usagePlaces = {
  anun_kamppa: {
    label: "🏠 Anun kämppä",
    color: "#8ecae6",
  },

  anun_auto: {
    label: "🚗 Anun auto",
    color: "#219ebc",
  },

  onskin_kamppa: {
    label: "🏡 Onskin kämppä",
    color: "#90be6d",
  },

  onskin_auto: {
    label: "🚙 Onskin auto",
    color: "#f4a261",
  },

  onskin_vene: {
    label: "🚤 Onskin vene",
    color: "#4dabf7",
  },

  lemmikit: {
  label: "🐾 Lemmikit",
  color: "#f9a8d4",
},

  metsa: {
  label: "🌲 Metsä",
  color: "#166534",
},

  muu: {
    label: "📍 Muu",
    color: "#adb5bd",
  },
};

export type UsagePlaceKey = keyof typeof usagePlaces;

export function getUsagePlaceLabel(place?: string | null) {
  if (!place) return usagePlaces.muu.label;
  return usagePlaces[place as UsagePlaceKey]?.label || place;
}

export function getUsagePlaceColor(place?: string | null) {
  if (!place) return usagePlaces.muu.color;
  return usagePlaces[place as UsagePlaceKey]?.color || usagePlaces.muu.color;
}