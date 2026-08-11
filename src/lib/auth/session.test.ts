import { describe, expect, it } from "vitest";

import { sessionRedirectReason } from "@/lib/auth/session";

describe("session redirect classification", () => {
  it("treats missing, verifier-only, and null cookies as a first visit", () => {
    expect(sessionRedirectReason([])).toBe("sign-in-required");
    expect(
      sessionRedirectReason([
        { name: "sb-project-auth-token-code-verifier", value: "verifier" },
        { name: "sb-project-auth-token", value: "base64-null" },
      ]),
    ).toBe("sign-in-required");
  });

  it("recognizes regular and chunked Supabase session cookies", () => {
    expect(
      sessionRedirectReason([
        { name: "sb-project-auth-token.0", value: "base64-session" },
      ]),
    ).toBe("session-expired");
  });
});
