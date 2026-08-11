"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, KeyRound, ShieldCheck, UserPlus, UserX } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createEmployeeAccountAction,
  resetEmployeePasswordAction,
  setEmployeeAccountStatusAction,
} from "@/app/(admin)/admin/employees/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  accountStatusSchema,
  createEmployeeAccountSchema,
  resetPasswordSchema,
  type AccountStatusInput,
  type CreateEmployeeAccountInput,
  type ResetPasswordInput,
} from "@/validation/auth";

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

function FormError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function AccountManagement({ employees }: { employees: EmployeeAccountRow[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetAccount, setResetAccount] = useState<SelectedAccount | null>(null);
  const [statusAccount, setStatusAccount] = useState<SelectedAccount | null>(null);
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const eligibleEmployees = useMemo(
    () => employees.filter((employee) => !employee.profileId),
    [employees],
  );

  const createForm = useForm<CreateEmployeeAccountInput>({
    resolver: zodResolver(createEmployeeAccountSchema),
    defaultValues: { employeeId: "", username: "", password: "" },
  });
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { profileId: "", password: "", reason: "" },
  });
  const statusForm = useForm<AccountStatusInput>({
    resolver: zodResolver(accountStatusSchema),
    defaultValues: { profileId: "", enabled: false, reason: "" },
  });

  function showResult(result: { error?: string; oneTimePassword?: string; success?: string }) {
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    if (result.oneTimePassword) {
      setOneTimePassword(result.oneTimePassword);
    }
    toast.success(result.success ?? "Account updated.");
    return true;
  }

  function submitCreate(values: CreateEmployeeAccountInput) {
    startTransition(async () => {
      const result = await createEmployeeAccountAction(values);
      if (showResult(result)) {
        setCreateOpen(false);
        createForm.reset();
      }
    });
  }

  function submitReset(values: ResetPasswordInput) {
    startTransition(async () => {
      const result = await resetEmployeePasswordAction(values);
      if (showResult(result)) {
        setResetAccount(null);
        resetForm.reset();
      }
    });
  }

  function submitStatus(values: AccountStatusInput) {
    startTransition(async () => {
      const result = await setEmployeeAccountStatusAction(values);
      if (showResult(result)) {
        setStatusAccount(null);
        statusForm.reset();
      }
    });
  }

  function openReset(account: SelectedAccount) {
    resetForm.reset({ profileId: account.profileId, password: "", reason: "" });
    setResetAccount(account);
  }

  function openStatus(account: SelectedAccount) {
    statusForm.reset({
      profileId: account.profileId,
      enabled: account.status !== "active",
      reason: "",
    });
    setStatusAccount(account);
  }

  return (
    <div className="space-y-6">
      {oneTimePassword ? (
        <div className="rounded-xl border border-status-warning/30 bg-status-warning-muted p-4" role="status">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="font-semibold text-foreground">Copy this generated password now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                It is shown only for this completed action and cannot be retrieved later.
              </p>
              <code className="mt-3 block w-fit rounded-md border bg-background px-3 py-2 text-base font-semibold">
                {oneTimePassword}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(oneTimePassword);
                    toast.success("Password copied.");
                  } catch {
                    toast.error("Copy failed. Select and copy the password manually.");
                  }
                }}
              >
                <Copy aria-hidden="true" />
                Copy password
              </Button>
              <Button type="button" variant="outline" onClick={() => setOneTimePassword(null)}>
                I have saved it
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Employee accounts</CardTitle>
            <CardDescription className="mt-1">
              Create access for existing employee records, reset passwords, or change account status.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={eligibleEmployees.length === 0}
          >
            <UserPlus aria-hidden="true" />
            Create employee account
          </Button>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-semibold">No employee records are available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Employee records must exist before an Auth account can be issued.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const account =
                    employee.profileId && employee.username
                      ? ({ ...employee, profileId: employee.profileId, username: employee.username } satisfies SelectedAccount)
                      : null;
                  return (
                    <TableRow key={employee.employeeId}>
                      <TableCell>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.employeeNumber}{employee.position ? ` · ${employee.position}` : ""}
                        </p>
                      </TableCell>
                      <TableCell>{employee.username ?? "Not issued"}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "active" ? "success" : employee.status === "disabled" ? "warning" : "secondary"}>
                          {employee.status === "active" ? "Enabled" : employee.status === "disabled" ? "Disabled" : "No account"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {account ? (
                            <>
                              <Button type="button" variant="outline" size="sm" onClick={() => openReset(account)}>
                                <KeyRound aria-hidden="true" />
                                Reset password
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => openStatus(account)}>
                                {account.status === "active" ? <UserX aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                                {account.status === "active" ? "Disable account" : "Enable account"}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={createForm.handleSubmit(submitCreate)}>
            <DialogHeader>
              <DialogTitle>Create employee account</DialogTitle>
              <DialogDescription>
                The employee signs in with the username below. Supabase stores the password securely.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="employee-record">Employee record</Label>
                <Controller
                  control={createForm.control}
                  name="employeeId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="employee-record"
                        className="w-full"
                        aria-invalid={Boolean(createForm.formState.errors.employeeId)}
                      >
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleEmployees.map((employee) => (
                          <SelectItem key={employee.employeeId} value={employee.employeeId}>
                            {employee.employeeNumber} — {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormError message={createForm.formState.errors.employeeId?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-account-username">Username</Label>
                <Input id="new-account-username" autoComplete="off" {...createForm.register("username")} />
                <FormError message={createForm.formState.errors.username?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-account-password">Issued password</Label>
                <Input id="new-account-password" type="password" autoComplete="new-password" {...createForm.register("password")} />
                <p className="text-xs text-muted-foreground">Leave blank to generate a strong password shown once.</p>
                <FormError message={createForm.formState.errors.password?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create account"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetAccount)} onOpenChange={(open) => !open && setResetAccount(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={resetForm.handleSubmit(submitReset)}>
            <DialogHeader>
              <DialogTitle>Reset employee password</DialogTitle>
              <DialogDescription>
                Reset the password for {resetAccount?.name}. The existing password cannot be viewed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="reset-password">New password</Label>
                <Input id="reset-password" type="password" autoComplete="new-password" {...resetForm.register("password")} />
                <p className="text-xs text-muted-foreground">Leave blank to generate a password shown once.</p>
                <FormError message={resetForm.formState.errors.password?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-reason">Reason</Label>
                <Input id="reset-reason" {...resetForm.register("reason")} />
                <FormError message={resetForm.formState.errors.reason?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetAccount(null)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Resetting…" : "Reset password"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(statusAccount)} onOpenChange={(open) => !open && setStatusAccount(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={statusForm.handleSubmit(submitStatus)}>
            <DialogHeader>
              <DialogTitle>{statusAccount?.status === "active" ? "Disable" : "Enable"} employee account</DialogTitle>
              <DialogDescription>
                {statusAccount?.status === "active"
                  ? "The employee will lose application and database access. Existing passwords remain unreadable."
                  : "The employee will be able to sign in again with the currently issued password."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-5">
              <Label htmlFor="status-reason">Reason</Label>
              <Input id="status-reason" {...statusForm.register("reason")} />
              <FormError message={statusForm.formState.errors.reason?.message} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStatusAccount(null)}>Cancel</Button>
              <Button type="submit" variant={statusAccount?.status === "active" ? "destructive" : "default"} disabled={pending}>
                {pending ? "Saving…" : statusAccount?.status === "active" ? "Disable account" : "Enable account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
