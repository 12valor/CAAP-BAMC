"use client";

import { Button } from "@/components/ui/button";

export default function StatementError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Statement unavailable</h1>
      <p className="mt-2 text-muted-foreground">
        Your statement could not be loaded. Please try again.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
