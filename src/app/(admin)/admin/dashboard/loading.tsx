import { TableSkeleton } from "@/components/feedback/table-skeleton";
export default function Loading(){return <div className="space-y-6"><div className="h-24 animate-pulse rounded-lg bg-muted"/><div className="grid gap-4 md:grid-cols-3">{Array.from({length:6},(_,i)=><div key={i} className="h-32 animate-pulse rounded-lg bg-muted"/>)}</div><TableSkeleton/></div>}
