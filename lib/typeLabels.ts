export const eventTypes = {
  // 🚗 Auto
  auton_katsastus: {
    label: "🚗 Auton katsastus",
    color: "#e0f2fe",
  },

  auton_maaraaikaishuolto: {
    label: "🔧 Auton määräaikaishuolto",
    color: "#dbeafe",
  },

  auton_renkaat: {
    label: "🛞 Auton renkaat",
    color: "#e5e7eb",
  },

  // 🏠 Talotekniikka ja huollot
  nuohous: {
    label: "🔥 Nuohous",
    color: "#ffe5d0",
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

  maalämpö: {
    label: "🌡 Maalämpö",
    color: "#fde68a",
  },

  sauna: {
    label: "🧖 Sauna",
    color: "#fed7aa",
  },

  // 💧 Vesi ja viemäri
  likakaivo: {
    label: "💧 Likakaivo / harmaavesi",
    color: "#dbeafe",
  },

  vesi: {
    label: "🚿 Vesityö",
    color: "#dbeafe",
  },

  juomavesi: {
    label: "🚰 Kaivo / käyttövesi",
    color: "#bfdbfe",
  },

  // ⚡ Sähkö
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

  // 🌿 Piha ja ulkoalueet
  piha: {
    label: "🌿 Piha / pihatyöt",
    color: "#dcfce7",
  },

  polttopuut: {
    label: "🪵 Polttopuut",
    color: "#f5e6c8",
  },

  laituri: {
    label: "🛶 Laituri",
    color: "#dbeafe",
  },

  tienhoitomaksu: {
    label: "🚜 Tienhoitomaksu",
    color: "#ede9fe",
  },

  // ♻️ Jätehuolto
  jatehuolto: {
    label: "🗑 Sekajäteastian tyhjennys",
    color: "#e5e7eb",
  },

  biojatehuolto: {
    label: "🌱 Biojäteastian tyhjennys",
    color: "#dcfce7",
  },

  // 🧱 Rakennus ja kiinteistö
  rakennus: {
    label: "🧱 Rakennustyö",
    color: "#e7e5e4",
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