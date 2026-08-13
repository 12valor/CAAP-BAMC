import { describe, expect, it } from "vitest";

import {
  parsePublicEnvironment,
  serverEnvironmentSchema,
} from "@/validation/environment";

const validPublicEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_12345678901234567890",
};

const validServerEnvironment = {
  ...validPublicEnvironment,
  AUTH_RATE_LIMIT_SECRET: "r".repeat(32),
};

function legacyKey(role: string) {
  const payload = Buffer.from(JSON.stringify({ role })).toString("base64url");
  return `header.${payload}.signature`;
}

describe("parsePublicEnvironment", () => {
  it("accepts a Supabase URL and publishable key", () => {
    expect(parsePublicEnvironment(validPublicEnvironment)).toEqual(
      validPublicEnvironment,
    );
  });

  it("rejects a secret key in browser configuration", () => {
    expect(() =>
      parsePublicEnvironment({
        ...validPublicEnvironment,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          "sb_secret_123456789012345678901234",
      }),
    ).toThrow(/never a secret or service-role key/i);
  });

  it("rejects a non-HTTPS remote URL", () => {
    expect(() =>
      parsePublicEnvironment({
        ...validPublicEnvironment,
        NEXT_PUBLIC_SUPABASE_URL: "http://example.com",
      }),
    ).toThrow(/must use HTTPS/i);
  });
});

describe("serverEnvironmentSchema", () => {
  it("accepts current secret and legacy service-role server keys", () => {
    expect(
      serverEnvironmentSchema.safeParse({
        ...validServerEnvironment,
        SUPABASE_SECRET_KEY: `sb_secret_${"s".repeat(24)}`,
      }).success,
    ).toBe(true);
    expect(
      serverEnvironmentSchema.safeParse({
        ...validServerEnvironment,
        SUPABASE_SECRET_KEY: legacyKey("service_role"),
      }).success,
    ).toBe(true);
  });

  it("rejects a legacy anonymous key in the server-key slot", () => {
    expect(
      serverEnvironmentSchema.safeParse({
        ...validServerEnvironment,
        SUPABASE_SECRET_KEY: legacyKey("anon"),
      }).success,
    ).toBe(false);
  });
});
