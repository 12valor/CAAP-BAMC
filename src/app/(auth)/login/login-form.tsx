"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { loginAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/validation/auth";

export function LoginForm({ reason }: { reason?: string }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const sessionMessage =
    reason === "session-expired"
      ? "Your session ended. Sign in again to continue."
      : reason === "sign-in-required"
        ? "Sign in to access the requested page."
        : null;

  function submit(values: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      setServerError(result.error ?? null);
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      {sessionMessage ? (
        <div
          role="status"
          className="rounded-lg border border-status-info/25 bg-status-info-muted px-4 py-3 text-sm text-foreground"
        >
          {sessionMessage}
        </div>
      ) : null}

      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <UserRound
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="username"
            autoComplete="username"
            className="pl-10"
            aria-invalid={Boolean(form.formState.errors.username)}
            {...form.register("username")}
          />
        </div>
        {form.formState.errors.username ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.username.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="pl-10"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </div>
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <Button className="w-full" size="lg" type="submit" disabled={pending}>
        <LogIn aria-hidden="true" />
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-sm leading-6 text-muted-foreground">
        Accounts are issued by the CAAP BAMC bookkeeper. Contact the office if
        your account needs to be enabled or your password needs to be reset.
      </p>
    </form>
  );
}
