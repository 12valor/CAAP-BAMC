import type { Metadata } from "next";

import { FoundationPage } from "@/components/layout/foundation-page";

export const metadata: Metadata = {
  title: "Employee workspace",
};

export default function EmployeePage() {
  return (
    <FoundationPage
      eyebrow="Employee route group"
      title="Employee workspace"
      description="Employee statements and read-only self-service records are intentionally deferred to later approved phases."
    />
  );
}
