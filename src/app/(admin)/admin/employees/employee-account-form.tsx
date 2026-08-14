"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createEmployeeAccountAction } from "./actions";
import { AdminFormActions } from "@/components/admin/admin-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEmployeeAccountSchema,
  type CreateEmployeeAccountInput,
} from "@/validation/auth";

export function EmployeeAccountForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [oneTimePassword, setOneTimePassword] = useState<string>();
  const form = useForm<CreateEmployeeAccountInput>({
    resolver: zodResolver(createEmployeeAccountSchema),
    defaultValues: { employeeId, username: "", password: "" },
  });

  function submit(values: CreateEmployeeAccountInput) {
    startTransition(async () => {
      const result = await createEmployeeAccountAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
      if (result.oneTimePassword) {
        setOneTimePassword(result.oneTimePassword);
        return;
      }

      router.push(`/admin/employees/${employeeId}`);
      router.refresh();
    });
  }

  if (oneTimePassword) {
    return (
      <div
        className="border border-status-warning/30 bg-status-warning-muted p-5"
        role="status"
      >
        <h2 className="font-semibold">Account created</h2>
        <p className="mt-1 text-sm">Copy this generated password now. It will not be shown again.</p>
        <code className="my-4 block w-fit rounded border bg-background px-3 py-2 font-semibold">
          {oneTimePassword}
        </code>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(oneTimePassword);
                toast.success("Password copied.");
              } catch {
                toast.error("Copy failed.");
              }
            }}
          >
            <Copy />
            Copy password
          </Button>
          <Button asChild>
            <Link href={`/admin/employees/${employeeId}`}>Done</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)}>
      <input type="hidden" {...form.register("employeeId")} />
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="off" {...form.register("username")} />
          {form.formState.errors.username ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.username.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Issued password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to generate a password shown once.
          </p>
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
      </div>
      <AdminFormActions
        cancelHref={`/admin/employees/${employeeId}`}
        pending={pending}
        submitLabel="Create account"
      />
    </form>
  );
}
