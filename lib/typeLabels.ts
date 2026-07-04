export const eventTypes = {
  // 🚗 Auto
  auton_katsastus: {
    label: "🚗 Auton katsastus",
    color: "#e0f2fe",
  },

  auton_maaraaikaishuolto: {
    label: "🔧 Auton määräaikaishuolto",
    color: "#bfdbfe",
  },

  auton_renkaat: {
    label: "🛞 Auton renkaat",
    color: "#d1d5db",
  },

  auton_muu: {
    label: "🚗 Auto muu",
    color: "#c7d2fe",
  },

  // 🚤 Vene
  veneen_kevatkunnostus: {
    label: "🛥️ Veneen kevätkunnostus",
    color: "#ccfbf1",
  },

  veneen_syyshuolto: {
    label: "🍂 Veneen syyshuolto / talvisäilytys",
    color: "#fde68a",
  },

  veneen_moottorihuolto: {
    label: "⚙️ Veneen moottorihuolto",
    color: "#bfdbfe",
  },

  veneen_pohjahuolto: {
    label: "🧽 Veneen pohjan pesu / antifoulaus",
    color: "#a7f3d0",
  },

  veneen_akku: {
    label: "🔋 Veneen akun huolto",
    color: "#ddd6fe",
  },

  veneen_muu: {
    label: "⛵ Vene muu",
    color: "#c7d2fe",
  },

  // 🔥 Lämmitys
  nuohous: {
    label: "🔥 Nuohous",
    color: "#ffe5d0",
  },

  ilmalämpöpumppu: {
    label: "❄️ Ilmalämpöpumpun huolto",
    color: "#dbeafe",
  },

  ilp_suodatin: {
    label: "❄️ ILP:n suodattimen puhdistus",
    color: "#cffafe",
  },

  suodatin: {
    label: "🌬 Ilmanvaihdon suodattimen vaihto",
    color: "#ecfeff",
  },

  maalämpö: {
    label: "🌡 Maalämpö",
    color: "#fde68a",
  },

  // 🚨 Turvallisuus
  palovaroitin_patteri: {
    label: "🔋 Palovaroittimen pariston vaihto",
    color: "#fde047",
  },

  palovaroitin_vaihto: {
    label: "🚨 Palovaroittimen vaihto",
    color: "#f87171",
  },

  sammutin_tarkastus: {
    label: "🧯 Sammuttimen tarkastus",
    color: "#fb7185",
  },

  lukot: {
    label: "🔐 Lukkojen huolto",
    color: "#c4b5fd",
  },

  // 💧 Vesi ja viemäri
  vesi: {
    label: "🚿 Vesityö",
    color: "#bfdbfe",
  },

  juomavesi: {
    label: "🚰 Kaivo / käyttövesi",
    color: "#93c5fd",
  },

  likakaivo: {
    label: "💧 Likakaivo / harmaavesi",
    color: "#bae6fd",
  },

  // ⚡ Energia


  sahkomaksu: {
    label: "💡 Sähköenergia",
    color: "#fde68a",
  },

  sahkonsiirto: {
    label: "⚡ Sähkönsiirtomaksu",
    color: "#fcd34d",
  },

    sähkö: {
    label: "⚡ Sähkötyö",
    color: "#fef3c7",
  },

  // ⚡ Matkapuhelin ja internet, suoratoisto
  
  laajakaistaliittymä: {
    label: "🌐 Puhelin ja laajakaistaliittymä",
    color: "#c7d2fe",
  },

  suoratoistopalvelut: {
  label: "📺 Suoratoistopalvelut",
  color: "#f9a8d4",
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
    color: "#7dd3fc",
  },

  sadevesikourut: {
    label: "🪜 Sadevesikourujen puhdistus",
    color: "#86efac",
  },

  vesikatto: {
    label: "🏠 Vesikaton tarkastus",
    color: "#fecaca",
  },

  ikkunat: {
    label: "🪟 Ikkunoiden pesu",
    color: "#bae6fd",
  },

  tienhoitomaksu: {
    label: "🚜 Tienhoitomaksu",
    color: "#ede9fe",
  },

  // ♻️ Jätehuolto
  jatehuolto: {
    label: "🗑️ Sekajäteastian tyhjennys",
    color: "#e5e7eb",
  },

  biojatehuolto: {
    label: "🌱 Biojäte",
    color: "#bbf7d0",
  },

  // 🏗️ Rakennus
  
  remontointi: {
  label: "🛠️ Remontointi",
  color: "#ddd6fe",
},
  
  rakennus: {
    label: "🧱 Rakennustyö",
    color: "#e7e5e4",
  },

  sauna: {
    label: "🧖 Sauna",
    color: "#fed7aa",
  },

  kiinteistovero: {
    label: "🏠 Kiinteistövero",
    color: "#fee2e2",
  },

  // 🐾 Lemmikit
lemmikki_terveys: {
  label: "💉 Lemmikit / terveys",
  color: "#fecdd3",
},

lemmikki_nayttely: {
  label: "🏆 Lemmikit / näyttely",
  color: "#f9a8d4",
},

lemmikki_kayttokoe: {
  label: "🎯 Lemmikit / käyttökoe",
  color: "#c4b5fd",
},

lemmikki_muu: {
  label: "🐾 Lemmikit muu",
  color: "#e9d5ff",
},

  // 🌲 Metsä

metsanhoito: {
  label: "🌲 Metsänhoito",
  color: "#4ade80",
},

  // 📄 Muut
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