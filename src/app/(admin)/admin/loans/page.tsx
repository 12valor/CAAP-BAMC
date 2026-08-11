import type { Metadata } from "next";
import { Landmark } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Loans" };

export default function LoansPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Loans"
      description="Configurable loan records and schedules placeholder."
      actionLabel="Add loan"
      icon={Landmark}
    />
  );
}
