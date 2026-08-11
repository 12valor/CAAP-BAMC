import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "@/validation/environment";

const validEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_12345678901234567890",
};

describe("parsePublicEnvironment", () => {
  it("accepts a Supabase URL and publishable key", () => {
    expect(parsePublicEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it("rejects a secret key in browser configuration", () => {
    expect(() =>
      parsePublicEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          "sb_secret_123456789012345678901234",
      }),
    ).toThrow(/never a secret or service-role key/i);
  });

  it("rejects a non-HTTPS remote URL", () => {
    expect(() =>
      parsePublicEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_SUPABASE_URL: "http://example.com",
      }),
    ).toThrow(/must use HTTPS/i);
  });
});
