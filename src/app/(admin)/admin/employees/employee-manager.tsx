"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Eye, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { archiveEmployeeAction, saveEmployeeAction } from "./actions";
import { AccountManagement, type EmployeeAccountRow } from "./account-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export type EmployeeRow = {
  id: string; employee_number: string; complete_name: string; department: string | null;
  position_title: string | null; employment_status: string; employment_category: string;
  email_address: string | null; mobile_number: string | null; deleted_at: string | null;
  profile_id: string | null; username: string | null; account_status: string | null; sort_key: string;
  transaction_count: number; active_loan_count: number; leave_balance_count: number; document_count: number;
};

type Filters = { q: string; status: string; department: string; category: string; archived: "true" | "false"; cursorKey?: string; cursorId?: string };

function EmployeeFields({ row }: { row?: EmployeeRow | null }) {
  return <div className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="employeeId" value={row?.id ?? ""} />
    <div className="space-y-2"><Label>Employee number</Label><Input name="employeeNumber" required defaultValue={row?.employee_number} /></div>
    <div className="space-y-2"><Label>First name</Label><Input name="firstName" required defaultValue={row ? row.complete_name.split(" ")[0] : ""} /></div>
    <div className="space-y-2"><Label>Middle name</Label><Input name="middleName" /></div>
    <div className="space-y-2"><Label>Last name</Label><Input name="lastName" required defaultValue={row ? row.complete_name.split(" ").slice(1).join(" ") : ""} /></div>
    <div className="space-y-2"><Label>Department</Label><Input name="department" defaultValue={row?.department ?? ""} /></div>
    <div className="space-y-2"><Label>Position</Label><Input name="positionTitle" defaultValue={row?.position_title ?? ""} /></div>
    <div className="space-y-2"><Label>Employment category</Label><Input name="employmentCategory" required defaultValue={row?.employment_category ?? "Permanent"} /></div>
    <div className="space-y-2"><Label>Employment status</Label><Select name="employmentStatus" defaultValue={row?.employment_status ?? "active"}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["active","inactive","separated","retired"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label>Email address</Label><Input name="emailAddress" type="email" defaultValue={row?.email_address ?? ""} /></div>
    <div className="space-y-2"><Label>Mobile number</Label><Input name="mobileNumber" defaultValue={row?.mobile_number ?? ""} /></div>
    <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input name="addressText" /></div>
    <div className="space-y-2 sm:col-span-2"><Label>Notes</Label><Textarea name="notes" rows={3} /></div>
  </div>;
}

export function EmployeeManager({ rows, hasNext, filters, departments, categories }: { rows: EmployeeRow[]; hasNext: boolean; filters: Filters; departments: string[]; categories: string[] }) {
  const router = useRouter(); const [editing, setEditingState] = useState<EmployeeRow | null | undefined>();
  function setEditing(value: EmployeeRow | null | undefined) {
    if (value) { router.push(`/admin/employees/${value.id}?edit=true`); return; }
    setEditingState(value);
  }
  const [archive, setArchive] = useState<EmployeeRow | null>(null); const [pending, startTransition] = useTransition();
  const accountRows: EmployeeAccountRow[] = rows.filter((r)=>!r.deleted_at).map((r)=>({ employeeId:r.id, employeeNumber:r.employee_number, name:r.complete_name, position:r.position_title, profileId:r.profile_id, username:r.username, status:r.account_status === "active" ? "active" : r.profile_id ? "disabled" : null }));
  function submit(action: (data: FormData)=>Promise<{error?:string;success?:string}>, data: FormData, close:()=>void) { startTransition(async()=>{const result=await action(data); if(result.error) toast.error(result.error); else {toast.success(result.success); close(); router.refresh();}}); }
  const next = rows.at(-1);
  return <div className="space-y-6">
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Employee directory</CardTitle><Button onClick={()=>setEditing(null)}><Plus />Add employee</Button></CardHeader><CardContent className="space-y-4">
      <form className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)_auto]" method="get">
        <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="q" defaultValue={filters.q} className="pl-9" placeholder="Name, number, position, contact"/></div>
        <Select name="status" defaultValue={filters.status || "all"}><SelectTrigger className="w-full"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["active","inactive","separated","retired"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
        <Select name="department" defaultValue={filters.department || "all"}><SelectTrigger className="w-full"><SelectValue placeholder="Department"/></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{departments.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
        <Select name="category" defaultValue={filters.category || "all"}><SelectTrigger className="w-full"><SelectValue placeholder="Category"/></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
        <Select name="archived" defaultValue={filters.archived}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="false">Current only</SelectItem><SelectItem value="true">Include archived</SelectItem></SelectContent></Select><Button type="submit" variant="outline">Apply filters</Button>
      </form>
      {rows.length ? <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department / position</TableHead><TableHead>Status</TableHead><TableHead>Linked records</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map(row=><TableRow key={row.id} className={row.deleted_at ? "opacity-60" : ""}><TableCell><p className="font-medium">{row.complete_name}</p><p className="text-sm text-muted-foreground">{row.employee_number} · {row.username ?? "No account"}</p></TableCell><TableCell>{row.department ?? "—"}<p className="text-sm text-muted-foreground">{row.position_title ?? "No position"}</p></TableCell><TableCell><Badge variant={row.deleted_at ? "secondary" : row.employment_status === "active" ? "success" : "warning"}>{row.deleted_at ? "Archived" : row.employment_status}</Badge></TableCell><TableCell className="text-sm">{row.transaction_count} transactions · {row.active_loan_count} loans<br/>{row.leave_balance_count} leave · {row.document_count} documents</TableCell><TableCell><div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/employees/${row.id}`}><Eye/>View</Link></Button>{!row.deleted_at&&<Button size="sm" variant="outline" onClick={()=>setEditing(row)}><Pencil/>Edit</Button>}<Button size="sm" variant="outline" onClick={()=>setArchive(row)}>{row.deleted_at?<RotateCcw/>:<Archive/>}{row.deleted_at?"Restore":"Archive"}</Button></div></TableCell></TableRow>)}</TableBody></Table> : <div className="rounded-lg border border-dashed p-10 text-center"><p className="font-semibold">No employees match these filters</p><p className="text-sm text-muted-foreground">Clear filters or add the first employee record.</p></div>}
      <div className="flex justify-end gap-2"><Button asChild variant="outline"><Link href="/admin/employees">First page</Link></Button>{hasNext&&next?<Button asChild><Link href={{pathname:"/admin/employees",query:{q:filters.q,status:filters.status,department:filters.department,category:filters.category,archived:filters.archived,cursorKey:next.sort_key,cursorId:next.id}}}>Next 25</Link></Button>:null}</div>
    </CardContent></Card>
    <AccountManagement employees={accountRows}/>
    <Dialog open={editing !== undefined} onOpenChange={(open)=>!open&&setEditing(undefined)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><form onSubmit={(e)=>{e.preventDefault();submit(saveEmployeeAction,new FormData(e.currentTarget),()=>setEditing(undefined));}}><DialogHeader><DialogTitle>{editing?"Edit employee":"Add employee"}</DialogTitle><DialogDescription>Employee numbers must be unique. Passwords are managed separately and are never displayed.</DialogDescription></DialogHeader><div className="py-5"><EmployeeFields row={editing}/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setEditing(undefined)}>Cancel</Button><Button disabled={pending}>{pending?"Saving…":"Save employee"}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(archive)} onOpenChange={(open)=>!open&&setArchive(null)}><DialogContent><form onSubmit={(e)=>{e.preventDefault();submit(archiveEmployeeAction,new FormData(e.currentTarget),()=>setArchive(null));}}><DialogHeader><DialogTitle>{archive?.deleted_at?"Restore employee":"Archive employee"}</DialogTitle><DialogDescription>{archive?.deleted_at?"Restore this employee to current records.":"The record remains auditable. A linked account is disabled."}</DialogDescription></DialogHeader><input type="hidden" name="employeeId" value={archive?.id}/><input type="hidden" name="operation" value={archive?.deleted_at?"restore":"archive"}/><div className="space-y-2 py-5"><Label>Reason</Label><Textarea name="reason" required minLength={5}/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setArchive(null)}>Cancel</Button><Button disabled={pending} variant={archive?.deleted_at?"default":"destructive"}>{pending?"Saving…":archive?.deleted_at?"Restore employee":"Archive employee"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}
