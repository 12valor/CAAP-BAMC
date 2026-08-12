const SENSITIVE_KEY = /(password|passcode|secret|token|api.?key|signed.?url|storage_object_path|source_data|normalized_data|username_fingerprint|network_fingerprint)/i;

export function formatExactMoney(value: string | number | null | undefined) {
  const raw = String(value ?? "0").trim();
  const match = raw.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return `PHP ${raw}`;
  const [, sign, whole, fraction = ""] = match;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimals = fraction.length ? `.${fraction}` : ".00";
  return `${sign ? "-" : ""}PHP ${grouped}${decimals}`;
}

export function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !SENSITIVE_KEY.test(key))
    .map(([key, item]) => [key, sanitizeAuditValue(item)]));
}

export type SafeDifference = { field: string; before: string; after: string };
export function auditDifferences(oldValue: unknown, newValue: unknown): SafeDifference[] {
  const before = sanitizeAuditValue(oldValue) as Record<string, unknown> | null;
  const after = sanitizeAuditValue(newValue) as Record<string, unknown> | null;
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])).slice(0, 20).map((field) => ({
    field: field.replaceAll("_", " "), before: display(before?.[field]), after: display(after?.[field]),
  }));
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 240);
  return String(value).slice(0, 240);
}
