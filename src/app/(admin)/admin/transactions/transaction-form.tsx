"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { saveTransactionAction } from "./actions";
import type { TransactionEmployee, TransactionRow, TransactionTypeOption } from "./transaction-manager";
import { AdminFormActions } from "@/components/admin/admin-form-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DocumentOption = { id: string; employee_id: string; original_filename: string };

export function TransactionForm({ transaction, employees, types, documents }: { transaction?: TransactionRow; employees: TransactionEmployee[]; types: TransactionTypeOption[]; documents: DocumentOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <form onSubmit={(event) => { event.preventDefault(); startTransition(async () => { const result = await saveTransactionAction(new FormData(event.currentTarget)); if (result.error) { toast.error(result.error); return; } toast.success(result.success); router.push("/admin/transactions"); router.refresh(); }); }}><input type="hidden" name="transactionId" value={transaction?.id ?? ""} /><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="employeeId">Employee</Label><Select name="employeeId" defaultValue={transaction?.employee_id}><SelectTrigger id="employeeId" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.employee_number} · {employee.first_name} {employee.last_name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="transactionTypeId">Transaction type</Label><Select name="transactionTypeId" defaultValue={transaction?.transaction_type_id}><SelectTrigger id="transactionTypeId" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{types.map((type) => <SelectItem key={type.id} value={type.id}>{type.direction.toUpperCase()} · {type.name}</SelectItem>)}</SelectContent></Select></div><Field label="Date" name="date" type="date" required value={transaction?.transaction_date ?? new Date().toISOString().slice(0, 10)} /><Field label="Positive amount" name="amount" required value={transaction ? String(transaction.amount) : ""} /><Field label="Reference number" name="referenceNumber" value={transaction?.reference_number} /><div className="space-y-2"><Label htmlFor="attachmentDocumentId">Attachment</Label><Select name="attachmentDocumentId" defaultValue={transaction?.attachment_document_id ?? "none"}><SelectTrigger id="attachmentDocumentId" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No attachment</SelectItem>{documents.filter((document) => !transaction || document.employee_id === transaction.employee_id).map((document) => <SelectItem key={document.id} value={document.id}>{document.original_filename}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={transaction?.description ?? ""} /></div></div><AdminFormActions cancelHref="/admin/transactions" pending={pending} submitLabel={transaction ? "Save changes" : "Add transaction"} /></form>;
}

function Field({ label, name, type, required, value }: { label: string; name: string; type?: string; required?: boolean; value?: string | null }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required={required} inputMode={name === "amount" ? "decimal" : undefined} defaultValue={value ?? ""} /></div>; }
