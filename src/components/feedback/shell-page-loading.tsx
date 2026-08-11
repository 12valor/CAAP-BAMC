import { TableSkeleton } from "@/components/feedback/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ShellPageLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="space-y-6">
      <div className="space-y-3 border-b pb-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-[36rem] max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-36 w-full" />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}
