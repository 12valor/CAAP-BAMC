import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminFormLayout({
  title,
  backHref,
  children,
  note,
}: {
  title: string;
  backHref: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header className="border-b pb-4">
        <Button asChild variant="link" className="mb-1 h-auto px-0">
          <Link href={backHref}>Back</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {note ? <p className="mt-1 text-sm text-muted-foreground">{note}</p> : null}
      </header>
      {children}
    </div>
  );
}

export function AdminFormActions({
  cancelHref,
  pending,
  submitLabel = "Save",
}: {
  cancelHref: string;
  pending: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4 backdrop-blur-sm">
      <Button asChild type="button" variant="outline">
        <Link href={cancelHref}>Cancel</Link>
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
