import { requireRole } from "@/lib/permissions/authorization";
import { buildPdf, safeReportFilename } from "@/lib/reports/export";
import { PDF_REPORTS, REPORTS, type ReportId } from "@/lib/reports/types";
import { parseReportFilters } from "@/lib/reports/validation";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{report:string}>}){await requireRole("admin");const{report}=await params;if(!REPORTS.includes(report as ReportId)||!PDF_REPORTS.has(report as ReportId))return new Response("PDF is not available for this report.",{status:404});const url=new URL(request.url);const filters=parseReportFilters({...Object.fromEntries(url.searchParams),report});try{const bytes=await buildPdf(filters);return new Response(bytes,{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename=${safeReportFilename(report,"pdf")}`,"cache-control":"private, no-store"}})}catch(error){return new Response(error instanceof RangeError?error.message:"Unable to generate the PDF.",{status:error instanceof RangeError?413:500})}}
