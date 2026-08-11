import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Leave Records" };

export default function LeaveRecordsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Leave Records"
      description="Leave balance and history management placeholder."
      actionLabel="Add leave record"
      icon={CalendarDays}
    />
  );
}
