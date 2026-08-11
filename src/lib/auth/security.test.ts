import { describe, expect, it } from "vitest";

import {
  createRequestFingerprint,
  generateIssuedPassword,
  normalizeUsername,
} from "@/lib/auth/security";
import { issuedPasswordSchema } from "@/validation/auth";

describe("authentication security utilities", () => {
  it("normalizes usernames and creates stable keyed fingerprints", () => {
    expect(normalizeUsername("  Employee.One ")).toBe("employee.one");
    expect(createRequestFingerprint("value", "a".repeat(32))).toBe(
      createRequestFingerprint("value", "a".repeat(32)),
    );
    expect(createRequestFingerprint("value", "a".repeat(32))).not.toBe(
      createRequestFingerprint("value", "b".repeat(32)),
    );
  });

  it("generates passwords that satisfy the issued-password policy", () => {
    for (let index = 0; index < 10; index += 1) {
      expect(issuedPasswordSchema.safeParse(generateIssuedPassword()).success).toBe(true);
    }
  });
});
