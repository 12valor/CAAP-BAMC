import { describe, expect, it } from "vitest";

import {
  hasStatementSummary,
  normalizeEmployeeStatement,
} from "@/lib/portal/statement-normalize";

const employee = {
  id: "employee-1",
  employee_number: "BAMC-001",
  full_name: "Sample Employee",
};

describe("normalizeEmployeeStatement", () => {
  it("uses the authenticated overview for a legacy Phase 10 payload", () => {
    const result = normalizeEmployeeStatement(
      {
        employee,
        generated_at: "2026-08-14T00:00:00Z",
        period: { start: null, end: null },
        totals: { debit: "150.25", credit: "50.00" },
        transactions: [],
        loans: [
          {
            id: "loan-1",
            type: "GL",
            principal: "1000.00",
            total_payable: "1100.00",
            status: "active",
            schedules: [
              { due_date: "2026-09-01", total_due: "100.00", status: "pending" },
            ],
          },
        ],
        rebates: [],
        attachments: [],
      },
      { current_balance: "100.25", outstanding_amount: "850.00" },
    );

    expect(result?.summary).toEqual({
      current_balance: "100.25",
      selected_debit: "150.25",
      selected_credit: "50.00",
      outstanding_loan_balance: "850.00",
    });
    expect(result?.loans[0].schedules[0]).toMatchObject({
      installment_number: 1,
      scheduled_amount: "100.00",
      amount_paid: null,
      remaining_amount: null,
    });
  });

  it("preserves the redesigned summary without requiring a fallback", () => {
    const payload = {
      employee,
      generated_at: "2026-08-14T00:00:00Z",
      period: { start: null, end: null },
      summary: {
        current_balance: "10.00",
        selected_debit: "20.00",
        selected_credit: "10.00",
        outstanding_loan_balance: "30.00",
      },
      totals: { debit: "20.00", credit: "10.00" },
      transactions: [],
      loans: [],
      rebates: [],
      attachments: [],
    };

    expect(hasStatementSummary(payload)).toBe(true);
    expect(normalizeEmployeeStatement(payload)?.summary.current_balance).toBe(
      "10.00",
    );
  });
});
