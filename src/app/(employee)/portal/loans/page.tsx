import type { Metadata } from "next";
import { HandCoins } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "My Loans" };

export default function PortalLoansPage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Loans"
      description="Read-only employee loans and payment schedules placeholder."
      actionLabel="Print loan details"
      icon={HandCoins}
    />
  );
}
