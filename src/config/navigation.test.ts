import { describe, expect, it } from "vitest";

import { adminNavigation, employeeNavigation } from "@/config/navigation";

describe("role navigation", () => {
  it("keeps the required admin destinations in review order", () => {
    expect(adminNavigation.map((item) => item.label)).toEqual([
      "Dashboard",
      "Employees",
      "Transactions",
      "Loans",
      "Rebates",
      "Leave Records",
      "Documents",
      "Imports",
      "Reports",
      "Audit Log",
      "Settings",
    ]);
  });

  it("exposes only the canonical statement destination for employees", () => {
    expect(employeeNavigation.map((item) => [item.label, item.href])).toEqual([
      ["Statement of Account", "/statement-of-account"],
    ]);
  });
});
