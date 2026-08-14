"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { changeTransactionArchiveAction } from "./actions";
import { AdminTableFrame, AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export type TransactionRow = { id: string; employee_id: string; transaction_type_id: string; transaction_date: string; reference_number: string | null; direction: "debit" | "credit"; amount: number; status: string; description: string | null; attachment_document_id: string | null; deleted_at: string | null; employee_name: string; employee_number: string; transaction_type_name: string; category_name: string; running_balance: number };
export type TransactionPageData = { items: TransactionRow[]; debit_total: number; credit_total: number; net_balance: number };
export type TransactionEmployee = { id: string; employee_number: string; first_name: string; last_name: string };
export type TransactionTypeOption = { id: string; name: string; direction: string; financial_category_id: string; reference_strategy: string };

const money = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

export function TransactionManager({ page, employees, types, filters }: { page: TransactionPageData; employees: TransactionEmployee[]; types: TransactionTypeOption[]; filters: Record<string, string | undefined> }) {
  const router = useRouter();
  const [archiving, setArchiving] = useState<TransactionRow | null>(null);
  const [pending, startTransition] = useTransition();
  const items = page.items ?? [];
  const hasNext = items.length > 25;
  const rows = hasNext ? items.slice(0, 25) : items;
  const last = rows.at(-1);
  return <div className="space-y-4">
    <div className="grid gap-3 md:grid-cols-3">{[["Debits", page.debit_total], ["Credits", page.credit_total], ["Balance", page.net_balance]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{money(Number(value))}</p></CardContent></Card>)}</div>
    <AdminTableFrame>
      <AdminTableToolbar><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">{rows.length} transactions shown</p><Button asChild><Link href="/admin/transactions/new"><Plus />Add transaction</Link></Button></div><form method="get" className="grid gap-3 lg:grid-cols-[2fr_repeat(5,1fr)_auto]"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" name="q" defaultValue={filters.q} placeholder="Search ledger" /></div><Select name="employee" defaultValue={filters.employee ?? "all"}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All employees</SelectItem>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.employee_number} · {employee.last_name}</SelectItem>)}</SelectContent></Select><Select name="type" defaultValue={filters.type ?? "all"}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{types.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select><Input name="from" type="date" defaultValue={filters.from} /><Input name="to" type="date" defaultValue={filters.to} /><Select name="archived" defaultValue={filters.archived ?? "false"}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Current</SelectItem><SelectItem value="true">Include deleted</SelectItem></SelectContent></Select><Button variant="outline">Filter</Button></form></AdminTableToolbar>
      {rows.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date / reference</TableHead><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id} className={row.deleted_at ? "opacity-60" : ""}><TableCell>{row.transaction_date}<p className="text-sm text-muted-foreground">{row.reference_number ?? "—"}</p></TableCell><TableCell>{row.employee_name}<p className="text-sm text-muted-foreground">{row.employee_number}</p></TableCell><TableCell><Badge variant={row.direction === "debit" ? "warning" : "success"}>{row.direction}</Badge> {row.transaction_type_name}</TableCell><TableCell className="text-right">{money(row.amount)}</TableCell><TableCell className="text-right">{money(row.running_balance)}</TableCell><TableCell><div className="flex justify-end gap-2">{!row.deleted_at ? <Button asChild size="sm" variant="outline"><Link href={`/admin/transactions/${row.id}/edit`}><Pencil />Edit</Link></Button> : null}<Button size="sm" variant="outline" onClick={() => setArchiving(row)}>{row.deleted_at ? <RotateCcw /> : <Archive />}{row.deleted_at ? "Restore" : "Delete"}</Button></div></TableCell></TableRow>)}</TableBody></Table></div> : <p className="p-10 text-center text-sm text-muted-foreground">No transactions found.</p>}
      <div className="flex justify-end gap-2 border-t p-4"><Button asChild variant="outline"><Link href="/admin/transactions">First page</Link></Button>{hasNext && last ? <Button asChild><Link href={{ pathname: "/admin/transactions", query: { ...filters, cursorDate: last.transaction_date, cursorId: last.id } }}>Next 25</Link></Button> : null}</div>
    </AdminTableFrame>
    <AlertDialog open={Boolean(archiving)} onOpenChange={(open) => !open && setArchiving(null)}><AlertDialogContent><form onSubmit={(event) => { event.preventDefault(); startTransition(async () => { const result = await changeTransactionArchiveAction(new FormData(event.currentTarget)); if (result.error) { toast.error(result.error); return; } toast.success(result.success); setArchiving(null); router.refresh(); }); }}><AlertDialogHeader><AlertDialogTitle>{archiving?.deleted_at ? "Restore transaction?" : "Delete transaction?"}</AlertDialogTitle><AlertDialogDescription>Permanent deletion is not available. This action is audited.</AlertDialogDescription></AlertDialogHeader><input type="hidden" name="recordId" value={archiving?.id} /><input type="hidden" name="operation" value={archiving?.deleted_at ? "restore" : "soft_delete"} /><div className="space-y-2 py-4"><Label htmlFor="transaction-reason">Reason</Label><Textarea id="transaction-reason" name="reason" required minLength={5} /></div><AlertDialogFooter><AlertDialogCancel type="button">Cancel</AlertDialogCancel><Button type="submit" variant={archiving?.deleted_at ? "default" : "destructive"} disabled={pending}>{archiving?.deleted_at ? "Restore" : "Delete"}</Button></AlertDialogFooter></form></AlertDialogContent></AlertDialog>
  </div>;
}
