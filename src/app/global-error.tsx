"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <section aria-labelledby="global-error-title" className="space-y-4">
            <h1 id="global-error-title" className="text-2xl font-semibold">
              The application encountered an error
            </h1>
            <p className="text-base text-muted-foreground">
              Retry the application or contact the system administrator.
            </p>
            <Button onClick={reset}>Retry application</Button>
          </section>
        </main>
      </body>
    </html>
  );
}
