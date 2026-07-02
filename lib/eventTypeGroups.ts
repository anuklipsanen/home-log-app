import { eventTypes } from "@/lib/typeLabels";

export const eventTypesByUsagePlace: Record<string, string[]> = {
  anun_auto: [
    "auton_katsastus",
    "auton_maaraaikaishuolto",
    "auton_renkaat",
    "auton_muu",
  ],

  onskin_auto: [
    "auton_katsastus",
    "auton_maaraaikaishuolto",
    "auton_renkaat",
    "auton_muu",
  ],

  onskin_vene: [
    "veneen_kevatkunnostus",
    "veneen_syyshuolto",
    "veneen_moottorihuolto",
    "veneen_pohjahuolto",
    "veneen_akku",
    "veneen_muu",
  ],

  anun_kamppa: [
    "nuohous",
    "palovaroitin_patteri",
    "palovaroitin_vaihto",
    "sammutin_tarkastus",
    "ilmalämpöpumppu",
    "ilp_suodatin",
    "suodatin",
    "maalämpö",
    "sähkö",
    "sahkomaksu",
    "sahkonsiirto",
    "vesi",
    "juomavesi",
    "likakaivo",
    "sauna",
    "piha",
    "polttopuut",
    "laituri",
    "sadevesikourut",
    "vesikatto",
    "ikkunat",
    "jatehuolto",
    "biojatehuolto",
    "rakennus",
    "kiinteistovero",
    "tienhoitomaksu",
  ],

  onskin_kamppa: [
    "nuohous",
    "palovaroitin_patteri",
    "palovaroitin_vaihto",
    "sammutin_tarkastus",
    "ilmalämpöpumppu",
    "ilp_suodatin",
    "suodatin",
    "maalämpö",
    "sähkö",
    "sahkomaksu",
    "sahkonsiirto",
    "vesi",
    "juomavesi",
    "likakaivo",
    "sauna",
    "piha",
    "polttopuut",
    "laituri",
    "sadevesikourut",
    "vesikatto",
    "ikkunat",
    "jatehuolto",
    "biojatehuolto",
    "rakennus",
    "kiinteistovero",
    "tienhoitomaksu",
  ],
};

export function getEventTypeOptionsForUsagePlace(usagePlace?: string | null) {
  const preferredKeys = eventTypesByUsagePlace[usagePlace || ""] || [];
  const preferredSet = new Set(preferredKeys);

  const preferred = preferredKeys
    .filter((key) => key in eventTypes)
    .map((key) => [key, eventTypes[key as keyof typeof eventTypes]] as const);

  const others = Object.entries(eventTypes).filter(
    ([key]) => !preferredSet.has(key)
  );

  return [...preferred, ...others];
}