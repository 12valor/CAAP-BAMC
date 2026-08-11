import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Documents"
      description="Employee-first document folders placeholder."
      actionLabel="Upload document"
      icon={FolderOpen}
    />
  );
}
