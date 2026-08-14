import { Skeleton } from "@/components/ui/skeleton";

export default function StatementLoading() {
  return (
    <div
      className="mx-auto max-w-[210mm] space-y-5 px-4 py-8"
      role="status"
      aria-label="Loading statement"
    >
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[34rem] w-full" />
    </div>
  );
}
