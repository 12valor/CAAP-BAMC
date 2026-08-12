import { z } from "zod";
import { REPORTS, type ReportFilters, type ReportId } from "./types";

const optionalDate = z.iso.date().optional();
const optionalUuid = z.uuid().optional();
const schema = z.object({
  report: z.enum(REPORTS).default("statement"),
  start: optionalDate,
  end: optionalDate,
  employee: optionalUuid,
  actor: optionalUuid,
  module: z.string().trim().max(80).regex(/^[a-z][a-z0-9_]*$/).optional(),
  status: z.string().trim().max(40).optional(),
  category: optionalUuid,
  department: z.string().trim().max(120).optional(),
  q: z.string().trim().max(100).optional(),
  cursorKey: z.string().trim().max(40).regex(/^[0-9T:Z+.-]+$/).optional(),
  cursorId: z.string().trim().max(40).regex(/^(?:[0-9]+|[0-9a-f-]{36})$/i).optional(),
}).refine((v) => !v.start || !v.end || v.start <= v.end, { message: "Start date must not be after end date." });

export function parseReportFilters(input: Record<string, string | string[] | undefined>): ReportFilters {
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const parsed = schema.safeParse(Object.fromEntries(Object.entries(input).map(([k, v]) => {const item=one(v);return [k,item==="all"||!item?undefined:item]})));
  if (!parsed.success) return { report: REPORTS.includes(one(input.report) as ReportId) ? one(input.report) as ReportId : "statement" };
  return parsed.data;
}

export function currentMonthManila(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(last).padStart(2, "0")}` };
}

export const EXPORT_LIMITS = { xlsx: 25_000, pdf: 2_000 } as const;
