import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "My Documents" };

export default function PortalDocumentsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Documents"
      description="Authorized employee document folders placeholder."
      actionLabel="View documents"
      icon={FileText}
    />
  );
}
