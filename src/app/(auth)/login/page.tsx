import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { CaapLogo } from "@/components/branding/caap-logo";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { getCurrentPrincipal, roleHome } from "@/lib/permissions/authorization";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const principal = await getCurrentPrincipal();
  if (principal) {
    redirect(roleHome(principal.role));
  }

  const { reason } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/35 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-28 items-center justify-center rounded-xl bg-white p-2 ring-1 ring-border">
            <CaapLogo priority className="max-h-16" sizes="112px" />
          </div>
          <p className="text-sm font-bold tracking-[0.16em] text-primary">
            CAAP BAMC
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Employee Financial Records
          </h1>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <h2 className="font-heading text-base font-medium leading-snug">
              Sign in
            </h2>
            <CardDescription>
              Enter the username and password issued by the bookkeeper.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm reason={reason} />
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Authorized CAAP BAMC personnel only
        </p>
      </div>
    </main>
  );
}
