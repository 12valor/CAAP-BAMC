import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Rebates" };

export default function RebatesPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Rebates"
      description="Rebate recording and review placeholder."
      actionLabel="Add rebate"
      icon={BadgePercent}
    />
  );
}
