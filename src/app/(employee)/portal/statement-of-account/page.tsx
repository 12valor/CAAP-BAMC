import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Statement of Account" };

export default function PortalStatementPage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Statement of Account"
      description="Statement, transaction history, and date filters placeholder."
      actionLabel="Download statement"
      icon={ReceiptText}
    />
  );
}
