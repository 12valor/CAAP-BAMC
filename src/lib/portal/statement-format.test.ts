import { describe, expect, it } from "vitest";

import { formatExactPeso } from "@/lib/portal/statement-format";

describe("formatExactPeso", () => {
  it("groups whole amounts and supplies two decimal places", () => {
    expect(formatExactPeso("1234567")).toBe("₱1,234,567.00");
  });

  it("preserves a negative sign and pads a one-digit fraction", () => {
    expect(formatExactPeso("-25.5")).toBe("-₱25.50");
  });

  it("does not truncate exact database precision", () => {
    expect(formatExactPeso("1000.12345")).toBe("₱1,000.12345");
  });
});
