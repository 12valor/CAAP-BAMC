import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Settings"
      description="Categories, types, and system settings placeholder."
      actionLabel="Review settings"
      icon={Settings}
      showFilters={false}
    />
  );
}
