"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { createEmployeeAccountAction } from "./actions";
import { AdminFormActions } from "@/components/admin/admin-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployeeAccountSchema, type CreateEmployeeAccountInput } from "@/validation/auth";

export function EmployeeAccountForm({ employeeId }: { employeeId: string }) {
  const [pending, startTransition] = useTransition();
  const [oneTimePassword, setOneTimePassword] = useState<string>();
  const form = useForm<CreateEmployeeAccountInput>({ resolver: zodResolver(createEmployeeAccountSchema), defaultValues: { employeeId, username: "", password: "" } });
  return <AccountFormInner form={form} pending={pending} oneTimePassword={oneTimePassword} submit={(values) => startTransition(async () => { const result = await createEmployeeAccountAction(values); if (result.error) { toast.error(result.error); return; } setOneTimePassword(result.oneTimePassword); toast.success(result.success); })} employeeId={employeeId} />;
}

function AccountFormInner({ form, pending, oneTimePassword, submit, employeeId }: { form: ReturnType<typeof useForm<CreateEmployeeAccountInput>>; pending: boolean; oneTimePassword?: string; submit: (values: CreateEmployeeAccountInput) => void; employeeId: string }) {
  return <form onSubmit={form.handleSubmit(submit)}><input type="hidden" {...form.register("employeeId")} />{oneTimePassword ? <div className="mb-5 border border-status-warning/30 bg-status-warning-muted p-4" role="status"><p className="font-semibold">Copy this generated password now</p><code className="my-3 block w-fit rounded border bg-background px-3 py-2 font-semibold">{oneTimePassword}</code><Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(oneTimePassword).then(() => toast.success("Password copied."))}><Copy />Copy</Button></div> : null}<div className="grid gap-5"><div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" autoComplete="off" {...form.register("username")} />{form.formState.errors.username ? <p className="text-sm text-destructive">{form.formState.errors.username.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="password">Issued password</Label><Input id="password" type="password" autoComplete="new-password" {...form.register("password")} /><p className="text-xs text-muted-foreground">Leave blank to generate a password shown once.</p>{form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}</div></div><AdminFormActions cancelHref={`/admin/employees/${employeeId}`} pending={pending} submitLabel="Create account" /></form>;
}
