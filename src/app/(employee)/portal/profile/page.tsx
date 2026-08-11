import type { Metadata } from "next";
import { UserRound } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "My Profile" };

export default function PortalProfilePage() {
  return (
    <SectionPlaceholder
      eyebrow="Employee self-service"
      title="Profile"
      description="Read-only employee profile placeholder."
      actionLabel="Print profile"
      icon={UserRound}
      showFilters={false}
    />
  );
}
