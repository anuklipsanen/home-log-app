export const eventTypes = {
  nuohous: {
    label: "🔥 Nuohous",
    color: "#ffe5d0",
  },

  likakaivo: {
    label: "💧 Likakaivo / harmaavesi",
    color: "#dbeafe",
  },

  jatehuolto: {
    label: "🗑 Sekajäteastian tyhjennys",
    color: "#e5e7eb",
  },

  biojatehuolto: {
    label: "🌱 Biojäteastian tyhjennys",
    color: "#dcfce7",
  },

  suodatin: {
    label: "🌬 Ilmanvaihdon suodattimen vaihto",
    color: "#ecfeff",
  },

  ilp_suodatin: {
    label: "❄️ ILP:n suodattimen puhdistus",
    color: "#ecfeff",
  },

  ilmalämpöpumppu: {
    label: "❄️ Ilmalämpöpumpun huolto",
    color: "#dbeafe",
  },

  sähkö: {
    label: "⚡ Sähkötyö",
    color: "#fef3c7",
  },

  sahkomaksu: {
    label: "💡 Sähköenergia",
    color: "#fef3c7",
  },

  sahkonsiirto: {
    label: "⚡ Sähkönsiirtomaksu",
    color: "#fde68a",
  },

  vesi: {
    label: "🚿 Vesityö",
    color: "#dbeafe",
  },

  juomavesi: {
    label: "🚰 Kaivo / käyttövesi",
    color: "#bfdbfe",
  },

  maalämpö: {
    label: "🌡 Maalämpö",
    color: "#fde68a",
  },

  sauna: {
    label: "🧖 Sauna",
    color: "#fed7aa",
  },

  rakennus: {
    label: "🧱 Rakennustyö",
    color: "#e7e5e4",
  },

  tienhoitomaksu: {
    label: "🚜 Tienhoitomaksu",
    color: "#ede9fe",
  },

  kiinteistovero: {
    label: "🏠 Kiinteistövero",
    color: "#fee2e2",
  },

  muu: {
    label: "📄 Muu",
    color: "#f3f4f6",
  },
};

export type EventTypeKey = keyof typeof eventTypes;

export function getEventTypeLabel(type?: string | null) {
  if (!type) return eventTypes.muu.label;
  return eventTypes[type as EventTypeKey]?.label || type;
}

export function getEventTypeColor(type?: string | null) {
  if (!type) return eventTypes.muu.color;
  return eventTypes[type as EventTypeKey]?.color || eventTypes.muu.color;
}