import { requireRole } from "@/lib/permissions/authorization";
import { buildXlsx, safeReportFilename } from "@/lib/reports/export";
import { REPORTS, type ReportId } from "@/lib/reports/types";
import { parseReportFilters } from "@/lib/reports/validation";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{report:string}>}){await requireRole("admin");const{report}=await params;if(!REPORTS.includes(report as ReportId))return new Response("Unknown report",{status:404});const url=new URL(request.url);const filters=parseReportFilters({...Object.fromEntries(url.searchParams),report});try{const bytes=await buildXlsx(filters);return new Response(bytes,{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":`attachment; filename=${safeReportFilename(report,"xlsx")}`,"cache-control":"private, no-store"}})}catch(error){return new Response(error instanceof RangeError?error.message:"Unable to generate the workbook.",{status:error instanceof RangeError?413:500})}}
