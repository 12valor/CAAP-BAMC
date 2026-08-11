import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "My Rebates" };

export default function EmployeeRebatesPage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Rebates"
      description="Read-only employee rebate history placeholder."
      actionLabel="Print rebates"
      icon={BadgePercent}
    />
  );
}
