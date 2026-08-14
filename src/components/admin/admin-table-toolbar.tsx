import { cn } from "@/lib/utils";

export function AdminTableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-muted/20 p-4", className)}>{children}</div>
  );
}

export function AdminTableFrame({ children }: { children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-lg border bg-card">{children}</section>;
}
