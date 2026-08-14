import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/permissions/authorization";
import { loadReport, searchEmployees } from "@/lib/reports/data";
import { formatExactMoney } from "@/lib/reports/format";
import { PDF_REPORTS, REPORT_LABELS, REPORTS } from "@/lib/reports/types";
import { currentMonthManila, parseReportFilters } from "@/lib/reports/validation";

export const metadata: Metadata = { title: "Reports" };
type Raw=Record<string,string|string[]|undefined>;
const value=(x:string|string[]|undefined)=>Array.isArray(x)?x[0]:x;

export default async function ReportsPage({searchParams}:{searchParams:Promise<Raw>}) {
  await requireRole("admin");const raw=await searchParams;let filters=parseReportFilters(raw);const all=value(raw.all)==="true";const dateReports=!['employees'].includes(filters.report);if(dateReports&&!all&&!filters.start&&!filters.end){const month=currentMonthManila();filters={...filters,...month};}
  const [page,employees]=await Promise.all([loadReport(filters),searchEmployees(value(raw.employeeSearch)??"")]);
  const base=Object.fromEntries(Object.entries(filters).filter(([,v])=>v));const exportQuery=new URLSearchParams(base as Record<string,string>).toString();
  return <div className="space-y-6"><PageHeader title="Reports"/>
    <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Report selection">{REPORTS.map(id=><Button key={id} size="sm" variant={filters.report===id?"default":"outline"} asChild><Link href={{pathname:"/admin/reports",query:{report:id}}}>{REPORT_LABELS[id]}</Link></Button>)}</nav>
    <Card><CardHeader><CardTitle>Report filters</CardTitle><CardDescription>Current month is selected initially. Choose All time or enter a custom period.</CardDescription></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-2 xl:grid-cols-7"><input type="hidden" name="report" value={filters.report}/><Input name="q" defaultValue={filters.q} placeholder="Search reference or name"/><Select name="employee" defaultValue={filters.employee??"all"}><SelectTrigger className="w-full"><SelectValue placeholder="All employees"/></SelectTrigger><SelectContent><SelectItem value="all">All employees</SelectItem>{employees.map(e=><SelectItem key={e.id} value={e.id}>{e.employee_number} - {e.first_name} {e.last_name}</SelectItem>)}</SelectContent></Select><Input name="department" defaultValue={filters.department} placeholder="Department"/><Input name="status" defaultValue={filters.status} placeholder="Status or action"/><Input name="start" type="date" defaultValue={filters.start}/><Input name="end" type="date" defaultValue={filters.end}/><Button>Apply filters</Button></form><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" asChild><Link href={`/admin/reports?report=${filters.report}&all=true`}>All time</Link></Button><Button size="sm" variant="ghost" asChild><Link href={`/admin/reports?report=${filters.report}`}>Current month</Link></Button></div></CardContent></Card>
    <Card><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>{page.title}</CardTitle><CardDescription>{page.description}</CardDescription></div><div className="flex shrink-0 gap-2"><Button variant="outline" asChild><a href={`/api/admin/reports/${filters.report}/xlsx?${exportQuery}`}><Download/>Excel</a></Button>{PDF_REPORTS.has(filters.report)&&<Button asChild><a href={`/api/admin/reports/${filters.report}/pdf?${exportQuery}`}><FileDown/>PDF</a></Button>}</div></CardHeader><CardContent>{page.rows.length&&page.columns.length?<div className="overflow-x-auto"><Table><TableHeader><TableRow>{page.columns.map(c=><TableHead key={c.key}>{c.label}</TableHead>)}</TableRow></TableHeader><TableBody>{page.rows.map(row=><TableRow key={row.id}>{page.columns.map(c=><TableCell key={c.key} className={c.kind==="money"?"text-right tabular-nums":"max-w-80"}>{c.kind==="money"?formatExactMoney(String(row[c.key]??0)):c.kind==="datetime"&&row[c.key]?new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(String(row[c.key]))):c.key==="status"||c.key==="action"||c.key==="direction"?<Badge variant="secondary">{String(row[c.key]??"").replaceAll("_"," ")}</Badge>:String(row[c.key]??"-")}</TableCell>)}</TableRow>)}</TableBody></Table></div>:<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{filters.report==="statement"&&!filters.employee?"Select an employee to generate a statement.":"No records match the selected filters."}</div>}
      <div className="mt-4 flex justify-end gap-2"><Button variant="outline" asChild><Link href={{pathname:"/admin/reports",query:{...base,cursorKey:undefined,cursorId:undefined}}}>First page</Link></Button>{page.nextCursor&&<Button asChild><Link href={{pathname:"/admin/reports",query:{...base,cursorKey:page.nextCursor.key,cursorId:page.nextCursor.id}}}>Next 50</Link></Button>}</div></CardContent></Card>
  </div>;
}
