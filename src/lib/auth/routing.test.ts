import { describe, expect, it } from "vitest";

import { roleHome } from "@/lib/auth/routing";

describe("roleHome", () => {
  it("routes employees directly to the statement", () =>
    expect(roleHome("employee")).toBe("/statement-of-account"));
  it("keeps administrators on the admin dashboard", () =>
    expect(roleHome("admin")).toBe("/admin/dashboard"));
});
