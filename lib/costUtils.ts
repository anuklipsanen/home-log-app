export function parseAmount(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  const normalized = value
    .replace("€", "")
    .replace(/\s/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatEuro(value: number) {
  return `${value.toFixed(2)} €`;
}