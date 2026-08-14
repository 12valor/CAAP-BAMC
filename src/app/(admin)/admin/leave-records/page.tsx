import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Leave Records" };

export default function LeaveRecordsPage() {
  return <div className="space-y-6"><PageHeader title="Leave records" /><div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">No leave records available.</div></div>;
}
