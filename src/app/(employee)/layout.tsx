import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/auth-actions";
import { CaapLogo } from "@/components/branding/caap-logo";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/permissions/authorization";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await requireRole("employee");

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <a
        href="#statement-content"
        className="fixed top-3 left-4 z-50 -translate-y-20 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus:translate-y-0 print:hidden"
      >
        Skip to statement
      </a>
      <header className="border-b bg-white print:hidden">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center bg-white p-1">
              <CaapLogo priority sizes="64px" className="max-h-10" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold tracking-wide text-primary">
                CAAP BAMC
              </p>
              <p className="truncate text-sm text-muted-foreground">
                Employee Statement of Account
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden max-w-56 truncate text-sm font-medium sm:block">
              {principal.displayName}
            </p>
            <form action={logoutAction}>
              <Button type="submit" variant="outline">
                <LogOut aria-hidden="true" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main id="statement-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </div>
  );
}
