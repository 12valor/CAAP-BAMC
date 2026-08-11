"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="error-title" className="space-y-4">
        <AlertTriangle aria-hidden="true" className="size-8 text-destructive" />
        <h1 id="error-title" className="text-2xl font-semibold">
          We could not load this page
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          Try the request again. If the problem continues, contact the system
          administrator.
        </p>
        <Button onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
