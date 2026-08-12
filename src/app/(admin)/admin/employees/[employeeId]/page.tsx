import Link from "next/link";
import { notFound } from "next/navigation";

import { saveEmployeeAction as saveEmployeeRecordAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const tabs = ["overview", "transactions", "loans", "rebates", "leave", "documents", "activity"] as const;
type Tab = typeof tabs[number];
type Props = { params: Promise<{ employeeId: string }>; searchParams: Promise<{ tab?: string; edit?: string }> };

export default async function EmployeeDetailPage({ params, searchParams }: Props) {
  await requireRole("admin");
  const { employeeId } = await params; const query = await searchParams;
  const tab: Tab = tabs.includes(query.tab as Tab) ? query.tab as Tab : "overview";
  const admin = createAdminClient();
  const { data: employee } = await admin.from("employee_profiles").select("*").eq("id", employeeId).maybeSingle();
  if (!employee) notFound();
  const [transactions, loans, rebates, leave, documents, activity] = await Promise.all([
    admin.from("transactions").select("id, transaction_date, direction, amount, status, reference_number").eq("employee_id", employeeId).order("transaction_date", { ascending:false }).limit(20),
    admin.from("loans").select("id, account_number, principal_amount, status, start_date").eq("employee_id", employeeId).order("start_date", { ascending:false }).limit(20),
    admin.from("rebates").select("id, rebate_date, amount, status, calculation_source").eq("employee_id", employeeId).order("rebate_date", { ascending:false }).limit(20),
    admin.from("leave_entries").select("id, effective_date, entry_kind, quantity_delta, status").eq("employee_id", employeeId).order("effective_date", { ascending:false }).limit(20),
    admin.from("documents").select("id, document_date, original_filename, status").eq("employee_id", employeeId).order("created_at", { ascending:false }).limit(20),
    admin.from("audit_logs").select("id, action, occurred_at, reason, entity_table").eq("entity_id", employeeId).order("occurred_at", { ascending:false }).limit(20),
  ]);
  const name = [employee.first_name, employee.middle_name, employee.last_name, employee.suffix].filter(Boolean).join(" ");
  const saveEmployeeAction = saveEmployeeRecordAction as unknown as (formData: FormData) => Promise<void>;
  const records: Record<Tab, Array<Record<string, unknown>>> = { overview: [], transactions: transactions.data ?? [], loans: loans.data ?? [], rebates: rebates.data ?? [], leave: leave.data ?? [], documents: documents.data ?? [], activity: activity.data ?? [] };
  return <div className="space-y-6">
    <div><Button asChild variant="link" className="px-0"><Link href="/admin/employees">← Employee directory</Link></Button><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{name}</h1><Badge variant={employee.deleted_at?"secondary":"success"}>{employee.deleted_at?"Archived":employee.employment_status}</Badge></div><p className="text-muted-foreground">{employee.employee_number} · {employee.department ?? "No department"} · {employee.position_title ?? "No position"}</p></div>
    <nav className="flex flex-wrap gap-1 border-b" aria-label="Employee record sections">{tabs.map(item=><Button key={item} asChild variant={tab===item?"default":"ghost"} className="rounded-b-none capitalize"><Link href={`/admin/employees/${employeeId}?tab=${item}`}>{item}</Link></Button>)}</nav>
    {tab === "overview" ? <div className="grid gap-6 xl:grid-cols-[1fr_2fr]"><Card><CardHeader><CardTitle>Contact and employment</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><b>Email:</b> {employee.email_address ?? "—"}</p><p><b>Mobile:</b> {employee.mobile_number ?? "—"}</p><p><b>Address:</b> {employee.address_text ?? "—"}</p><p><b>Category:</b> {employee.employment_category}</p><p><b>Notes:</b> {employee.notes ?? "—"}</p></CardContent></Card><Card><CardHeader><CardTitle>Edit employee</CardTitle></CardHeader><CardContent><form action={saveEmployeeAction} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="employeeId" value={employee.id}/>{[["employeeNumber","Employee number",employee.employee_number],["firstName","First name",employee.first_name],["middleName","Middle name",employee.middle_name],["lastName","Last name",employee.last_name],["suffix","Suffix",employee.suffix],["department","Department",employee.department],["positionTitle","Position",employee.position_title],["employmentCategory","Employment category",employee.employment_category],["employmentStatus","Employment status",employee.employment_status],["emailAddress","Email",employee.email_address],["mobileNumber","Mobile",employee.mobile_number],["addressText","Address",employee.address_text]].map(([key,label,value])=><div className="space-y-2" key={key}><Label htmlFor={key as string}>{label}</Label><Input id={key as string} name={key as string} defaultValue={(value as string|null)??""} required={["employeeNumber","firstName","lastName","employmentCategory","employmentStatus"].includes(key as string)}/></div>)}<div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" defaultValue={employee.notes??""}/></div><div className="sm:col-span-2"><Button type="submit">Save changes</Button></div></form></CardContent></Card></div> : <Card><CardHeader><CardTitle className="capitalize">{tab}</CardTitle></CardHeader><CardContent>{records[tab].length ? <div className="divide-y">{records[tab].map((record)=><pre key={String(record.id)} className="overflow-auto py-3 text-sm whitespace-pre-wrap">{Object.entries(record).filter(([key])=>key!=="id").map(([key,value])=>`${key.replaceAll("_"," ")}: ${String(value??"—")}`).join(" · ")}</pre>)}</div> : <p className="py-8 text-center text-muted-foreground">No {tab} records are linked to this employee.</p>}</CardContent></Card>}
  </div>;
}
