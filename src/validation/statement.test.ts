import { describe, expect, it } from "vitest";

import { parseStatementFilters } from "@/validation/statement";

describe("statement filters", () => {
  it("accepts all-transactions mode", () =>
    expect(parseStatementFilters({}).success).toBe(true));
  it("accepts valid dates and a category", () =>
    expect(
      parseStatementFilters({
        start: "2026-01-01",
        end: "2026-01-31",
        category: "00000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(true));
  it("rejects a reversed date range", () => {
    expect(
      parseStatementFilters({
        start: "2026-02-01",
        end: "2026-01-01",
      }).success,
    ).toBe(false);
  });
  it("does not accept an employee selector", () => {
    const parsed = parseStatementFilters({
      employeeId: "00000000-0000-4000-8000-000000000002",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).not.toHaveProperty("employeeId");
  });
});
