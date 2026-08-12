import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { CaapLogo } from "@/components/branding/caap-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-10">
      <Image
        src="/brand/bacolod-silay-airport-terminal.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[center_58%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-slate-950/45"
      />

      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-28 items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-white/80">
            <CaapLogo priority className="max-h-16" sizes="112px" />
          </div>
          <p className="text-sm font-bold tracking-[0.16em] text-white">
            CAAP BAMC
          </p>
        </div>

        <Card className="gap-0 rounded-2xl border-0 bg-white py-0 shadow-2xl shadow-slate-950/30 ring-1 ring-white/80">
          <CardHeader className="gap-2 border-b border-border/70 bg-muted/35 px-6 py-5">
            <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
            <CardDescription className="leading-6">
              Enter the username and password issued by the bookkeeper.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <LoginForm reason={reason} />
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-2 text-center text-xs font-medium text-white [text-shadow:0_1px_2px_rgb(15_23_42/0.75)]">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Authorized CAAP BAMC personnel only
        </p>
      </div>
    </main>
  );
}
