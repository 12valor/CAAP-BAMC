import { describe, expect, it } from "vitest";

import { employeeRecordSchema } from "@/validation/employee";

describe("employeeRecordSchema", () => {
  it("requires identity fields and validates contact email", () => {
    expect(employeeRecordSchema.safeParse({ employeeNumber: "", firstName: "", lastName: "" }).success).toBe(false);
    expect(employeeRecordSchema.safeParse({
      employeeNumber: "BAMC-001", firstName: "Ana", lastName: "Reyes",
      employmentCategory: "Permanent", employmentStatus: "active", emailAddress: "ana@example.test",
    }).success).toBe(true);
  });
});
