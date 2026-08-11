import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="not-found-title" className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          404
        </p>
        <h1 id="not-found-title" className="text-2xl font-semibold">
          Page not found
        </h1>
        <p className="text-base text-muted-foreground">
          The requested page does not exist or is not available.
        </p>
        <Button asChild>
          <Link href="/">Return to the home page</Link>
        </Button>
      </section>
    </main>
  );
}
