"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { archiveEmployeeAction } from "./actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EmployeeSafetyActions({ employeeId, archived }: { employeeId: string; archived: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return <AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger asChild><Button variant={archived ? "outline" : "destructive"}>{archived ? <RotateCcw /> : <Archive />}{archived ? "Restore" : "Archive"}</Button></AlertDialogTrigger><AlertDialogContent><form onSubmit={(event) => { event.preventDefault(); startTransition(async () => { const result = await archiveEmployeeAction(new FormData(event.currentTarget)); if (result.error) { toast.error(result.error); return; } toast.success(result.success); setOpen(false); router.refresh(); }); }}><AlertDialogHeader><AlertDialogTitle>{archived ? "Restore employee?" : "Archive employee?"}</AlertDialogTitle><AlertDialogDescription>{archived ? "The employee will return to current records." : "The record remains auditable and linked access is disabled."}</AlertDialogDescription></AlertDialogHeader><input type="hidden" name="employeeId" value={employeeId} /><input type="hidden" name="operation" value={archived ? "restore" : "archive"} /><div className="space-y-2 py-4"><Label htmlFor="employee-change-reason">Reason</Label><Textarea id="employee-change-reason" name="reason" required minLength={5} /></div><AlertDialogFooter><AlertDialogCancel type="button">Cancel</AlertDialogCancel><Button type="submit" variant={archived ? "default" : "destructive"} disabled={pending}>{archived ? "Restore" : "Archive"}</Button></AlertDialogFooter></form></AlertDialogContent></AlertDialog>;
}
