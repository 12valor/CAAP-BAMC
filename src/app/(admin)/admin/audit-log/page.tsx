import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Audit Log" };

export default function AuditLogPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Audit Log"
      description="Read-only audit event review placeholder."
      actionLabel="Export log"
      icon={ScrollText}
    />
  );
}
