export type AdminActionResult = { error?: string; success?: string; id?: string };

export function databaseActionError(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "23505") return "That employee number, username, code, or reference already exists.";
  if (error?.code === "23503") return "This record is linked to another record and cannot be changed that way.";
  if (error?.code === "23514" || error?.code === "22023") return error.message ?? "The values do not satisfy the required rules.";
  return fallback;
}
