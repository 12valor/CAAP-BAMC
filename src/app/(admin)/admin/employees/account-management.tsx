"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, KeyRound, ShieldCheck, UserPlus, UserX } from "lucide-react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";

import { resetEmployeePasswordAction, setEmployeeAccountStatusAction } from "./actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountStatusSchema, resetPasswordSchema, type AccountStatusInput, type ResetPasswordInput } from "@/validation/auth";

export type EmployeeAccountRow = {
  employeeId: string;
  employeeNumber: string;
  name: string;
  position: string | null;
  profileId: string | null;
  status: "active" | "disabled" | null;
  username: string | null;
};
type SelectedAccount = EmployeeAccountRow & { profileId: string; username: string };

export function AccountManagement({ employees }: { employees: EmployeeAccountRow[] }) {
  const [resetAccount, setResetAccount] = useState<SelectedAccount | null>(null);
  const [statusAccount, setStatusAccount] = useState<SelectedAccount | null>(null);
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { profileId: "", password: "", reason: "" } });
  const statusForm = useForm<AccountStatusInput>({ resolver: zodResolver(accountStatusSchema), defaultValues: { profileId: "", enabled: false, reason: "" } });

  function result(value: { error?: string; success?: string; oneTimePassword?: string }) {
    if (value.error) { toast.error(value.error); return false; }
    if (value.oneTimePassword) setOneTimePassword(value.oneTimePassword);
    toast.success(value.success);
    return true;
  }
  function openReset(account: SelectedAccount) {
    resetForm.reset({ profileId: account.profileId, password: "", reason: "" });
    setResetAccount(account);
  }
  function openStatus(account: SelectedAccount) {
    statusForm.reset({ profileId: account.profileId, enabled: account.status !== "active", reason: "" });
    setStatusAccount(account);
  }

  return (
    <section className="space-y-4">
      {oneTimePassword ? <OneTimePassword value={oneTimePassword} clear={() => setOneTimePassword(null)} /> : null}
      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b bg-muted/20 p-4"><h2 className="font-semibold">Account access</h2>{employees.some((employee) => !employee.profileId) ? <Button asChild size="sm"><Link href={`/admin/employees/${employees.find((employee) => !employee.profileId)?.employeeId}/account/new`}><UserPlus />Create account</Link></Button> : null}</div>
        <Table><TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {employees.map((employee) => {
            const account = employee.profileId && employee.username ? ({ ...employee, profileId: employee.profileId, username: employee.username } satisfies SelectedAccount) : null;
            return <TableRow key={employee.employeeId}><TableCell>{employee.username ?? "Not issued"}</TableCell><TableCell><Badge variant={employee.status === "active" ? "success" : employee.status === "disabled" ? "warning" : "secondary"}>{employee.status === "active" ? "Enabled" : employee.status === "disabled" ? "Disabled" : "No account"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{account ? <><Button size="sm" variant="outline" onClick={() => openReset(account)}><KeyRound />Reset password</Button><Button size="sm" variant="outline" onClick={() => openStatus(account)}>{account.status === "active" ? <UserX /> : <ShieldCheck />}{account.status === "active" ? "Disable" : "Enable"}</Button></> : null}</div></TableCell></TableRow>;
          })}
        </TableBody></Table>
      </div>

      <AlertDialog open={Boolean(resetAccount)} onOpenChange={(open) => !open && setResetAccount(null)}>
        <AlertDialogContent><form onSubmit={resetForm.handleSubmit((values) => startTransition(async () => { if (result(await resetEmployeePasswordAction(values))) { setResetAccount(null); resetForm.reset(); } }))}><AlertDialogHeader><AlertDialogTitle>Reset password?</AlertDialogTitle><AlertDialogDescription>The existing password cannot be viewed.</AlertDialogDescription></AlertDialogHeader><div className="grid gap-4 py-4"><Field label="New password" id="reset-password" type="password" registration={resetForm.register("password")} note="Leave blank to generate one." error={resetForm.formState.errors.password?.message} /><Field label="Reason" id="reset-reason" registration={resetForm.register("reason")} error={resetForm.formState.errors.reason?.message} /></div><AlertDialogFooter><AlertDialogCancel type="button">Cancel</AlertDialogCancel><Button type="submit" disabled={pending}>Reset password</Button></AlertDialogFooter></form></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(statusAccount)} onOpenChange={(open) => !open && setStatusAccount(null)}>
        <AlertDialogContent><form onSubmit={statusForm.handleSubmit((values) => startTransition(async () => { if (result(await setEmployeeAccountStatusAction(values))) { setStatusAccount(null); statusForm.reset(); } }))}><AlertDialogHeader><AlertDialogTitle>{statusAccount?.status === "active" ? "Disable account?" : "Enable account?"}</AlertDialogTitle><AlertDialogDescription>{statusAccount?.status === "active" ? "The employee will lose access until the account is enabled again." : "The employee will be able to sign in again."}</AlertDialogDescription></AlertDialogHeader><div className="py-4"><Field label="Reason" id="status-reason" registration={statusForm.register("reason")} error={statusForm.formState.errors.reason?.message} /></div><AlertDialogFooter><AlertDialogCancel type="button">Cancel</AlertDialogCancel><Button type="submit" variant={statusAccount?.status === "active" ? "destructive" : "default"} disabled={pending}>{statusAccount?.status === "active" ? "Disable" : "Enable"}</Button></AlertDialogFooter></form></AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Field({ label, id, type, registration, note, error }: { label: string; id: string; type?: string; registration: UseFormRegisterReturn; note?: string; error?: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} autoComplete={type === "password" ? "new-password" : undefined} {...registration} />{note ? <p className="text-xs text-muted-foreground">{note}</p> : null}{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

function OneTimePassword({ value, clear }: { value: string; clear: () => void }) {
  return <div className="border border-status-warning/30 bg-status-warning-muted p-4" role="status"><p className="font-semibold">Copy this password now</p><code className="my-3 block w-fit rounded border bg-background px-3 py-2 font-semibold">{value}</code><div className="flex gap-2"><Button type="button" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(value); toast.success("Password copied."); } catch { toast.error("Copy failed."); } }}><Copy />Copy</Button><Button type="button" variant="outline" onClick={clear}>Done</Button></div></div>;
}
