export const financialSettingKinds = ["financial_categories", "transaction_types", "interest_methods", "penalty_rules", "loan_types", "rebate_types"] as const;
export type FinancialSettingKind = (typeof financialSettingKinds)[number];
export function isFinancialSettingKind(value: string): value is FinancialSettingKind { return financialSettingKinds.includes(value as FinancialSettingKind); }
