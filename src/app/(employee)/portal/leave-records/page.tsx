import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "My Leave Records" };

export default function PortalLeavePage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Leave Records"
      description="Read-only leave balance and history placeholder."
      actionLabel="Print leave history"
      icon={CalendarDays}
    />
  );
}
