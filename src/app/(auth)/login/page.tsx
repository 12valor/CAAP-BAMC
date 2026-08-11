import type { Metadata } from "next";

import { FoundationPage } from "@/components/layout/foundation-page";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <FoundationPage
      eyebrow="Authentication"
      title="Sign in"
      description="The secure sign-in form and account recovery flow will be implemented in the approved authentication phase."
    />
  );
}
