import { describe, expect, it } from "vitest";

import {
  createEmployeeAccountSchema,
  loginSchema,
} from "@/validation/auth";

describe("authentication validation", () => {
  it("normalizes a username without changing the submitted password", () => {
    expect(
      loginSchema.parse({ username: " Employee.One ", password: " Exact Password " }),
    ).toEqual({ username: "employee.one", password: " Exact Password " });
  });

  it("accepts generated-password mode and rejects malformed usernames", () => {
    expect(
      createEmployeeAccountSchema.safeParse({
        employeeId: "72000000-0000-4000-8000-000000000002",
        username: "employee.one",
        password: "",
      }).success,
    ).toBe(true);
    expect(
      createEmployeeAccountSchema.safeParse({
        employeeId: "72000000-0000-4000-8000-000000000002",
        username: "Employee Directory",
        password: "",
      }).success,
    ).toBe(false);
  });
});
