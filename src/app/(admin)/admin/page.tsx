import type { Metadata } from "next";

import { FoundationPage } from "@/components/layout/foundation-page";

export const metadata: Metadata = {
  title: "Administrator workspace",
};

export default function AdminPage() {
  return (
    <FoundationPage
      eyebrow="Administrator route group"
      title="Administrator workspace"
      description="Administrator navigation, permissions, and financial management modules are intentionally deferred to later approved phases."
    />
  );
}
