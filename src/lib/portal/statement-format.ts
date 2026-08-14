export function formatExactPeso(
  value: string | number | null | undefined,
) {
  const raw = String(value ?? "0").trim();
  const match = raw.match(/^(-?)(\d+)(?:\.(\d+))?$/);

  if (!match) return `₱${raw}`;

  const [, sign, whole, fraction = ""] = match;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimals = fraction ? fraction.padEnd(2, "0") : "00";

  return `${sign ? "-" : ""}₱${grouped}.${decimals}`;
}
