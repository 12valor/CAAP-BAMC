import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "My Documents" };

export default function EmployeeDocumentsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Documents"
      description="Authorized employee document folders placeholder."
      actionLabel="View documents"
      icon={FolderOpen}
      showFilters={false}
    />
  );
}
