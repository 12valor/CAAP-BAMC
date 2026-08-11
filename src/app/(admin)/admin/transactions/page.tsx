import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Transactions"
      description="Transaction entry, review, and correction placeholder."
      actionLabel="Add transaction"
      icon={ArrowLeftRight}
    />
  );
}
