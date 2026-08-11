import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PreviewNotice } from "@/components/feedback/preview-notice";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewFilterBar } from "@/components/patterns/preview-filter-bar";
import { PreviewPrimaryAction } from "@/components/patterns/preview-primary-action";

type SectionPlaceholderProps = {
  actionLabel: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  showFilters?: boolean;
  title: string;
};

export function SectionPlaceholder({
  actionLabel,
  description,
  eyebrow,
  icon,
  showFilters = true,
  title,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<PreviewPrimaryAction label={actionLabel} />}
      />
      <PreviewNotice />
      {showFilters ? <PreviewFilterBar /> : null}
      <EmptyState
        icon={icon}
        title={`${title} is ready for review`}
        description="This route currently demonstrates the approved shell, spacing, controls, and empty state. Business data and mutations will be added in a later phase."
      />
    </div>
  );
}
