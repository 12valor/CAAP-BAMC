import type { Metadata } from "next";
import { ChartNoAxesCombined } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Reports"
      description="Financial and operational report placeholder."
      actionLabel="Create report"
      icon={ChartNoAxesCombined}
    />
  );
}
