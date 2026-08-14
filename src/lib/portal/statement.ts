import "server-only";

import { createClient } from "@/lib/supabase/server";

export type StatementFilters = {
  start?: string;
  end?: string;
  category?: string;
};
export type StatementTransaction = {
  id: string;
  date: string;
  reference_number: string | null;
  direction: "debit" | "credit";
  amount: string;
  description: string | null;
  transaction_type: string;
  category: string | null;
  running_balance: string;
};
export type StatementSchedule = {
  installment_number: number;
  due_date: string;
  scheduled_amount: string;
  amount_paid: string;
  remaining_amount: string;
  status: string;
};
export type EmployeeStatement = {
  employee: {
    id: string;
    employee_number: string;
    full_name: string;
    department: string | null;
    position_title: string | null;
  };
  period: { start: string | null; end: string | null };
  generated_at: string;
  summary: {
    current_balance: string;
    selected_debit: string;
    selected_credit: string;
    outstanding_loan_balance: string;
  };
  transactions: StatementTransaction[];
  totals: { debit: string; credit: string };
  loans: Array<{
    id: string;
    type: string;
    account_number: string | null;
    principal: string;
    total_payable: string;
    outstanding_balance: string;
    start_date: string;
    term_count: number | null;
    installment_frequency: string;
    status: string;
    next_payment_date: string | null;
    schedules: StatementSchedule[];
  }>;
  rebates: Array<{
    id: string;
    date: string;
    type: string;
    reference_number: string | null;
    amount: string;
    description: string | null;
    status: string;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    category: string;
    related_record: string;
    date: string | null;
    mime_type: string;
  }>;
};

export async function getMyStatement(filters: StatementFilters = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_statement", {
    start_date: filters.start || undefined,
    end_date: filters.end || undefined,
    type_filter: undefined,
    category_filter: filters.category || undefined,
  });
  if (error) throw new Error("Statement data could not be loaded.");
  return data as unknown as EmployeeStatement | null;
}
