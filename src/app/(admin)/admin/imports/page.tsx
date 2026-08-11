import type { Metadata } from "next";
import { FileUp } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Imports" };

export default function ImportsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Imports"
      description="Excel import review and validation placeholder."
      actionLabel="Start import"
      icon={FileUp}
    />
  );
}
