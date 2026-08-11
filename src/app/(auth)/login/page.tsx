import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landmark, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/app/(auth)/login/login-form";
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
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Landmark aria-hidden="true" className="size-7" />
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
