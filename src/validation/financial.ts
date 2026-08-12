import { z } from "zod";

export const moneyStringSchema = z.string().trim().regex(/^\d+(?:\.\d{1,6})?$/, "Enter a positive decimal amount.").refine((value) => BigInt(value.replace(".", "").padEnd(value.includes(".") ? value.indexOf(".") + 7 : value.length + 6, "0")) > 0n, "Amount must be greater than zero.");
const optional = z.string().trim().max(500).optional().transform((value)=>value||null);

export const transactionSchema = z.object({
  transactionId: z.string().uuid().optional(), employeeId: z.string().uuid(), transactionTypeId: z.string().uuid(),
  date: z.iso.date(), amount: moneyStringSchema, referenceNumber: optional,
  description: optional, attachmentDocumentId: z.string().uuid().optional().or(z.literal("")).transform(value=>value||null),
});
export const recordChangeSchema = z.object({ recordId:z.string().uuid(), operation:z.enum(["soft_delete","restore"]), reason:z.string().trim().min(5).max(500) });

export const settingSchema = z.object({
  kind: z.enum(["financial_categories","transaction_types","interest_methods","penalty_rules","loan_types","rebate_types"]),
  id: z.string().uuid().optional(), code:z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,39}$/), name:z.string().trim().min(2).max(120),
  direction:z.enum(["debit","credit"]).optional(), balanceEffect:z.enum(["increase","decrease","neutral"]).default("neutral"),
  strategy:z.string().trim().regex(/^[a-z][a-z0-9_]{1,49}$/).default("manual"),
  effectiveFrom:z.iso.date().optional().or(z.literal("")).transform(v=>v||null), effectiveTo:z.iso.date().optional().or(z.literal("")).transform(v=>v||null),
  percentage:z.string().trim().regex(/^\d+(?:\.\d{1,6})?$/).optional().or(z.literal("")), fixedAmount:z.string().trim().regex(/^\d+(?:\.\d{1,6})?$/).optional().or(z.literal("")),
  termLength:z.coerce.number().int().positive().max(600).optional(), frequency:z.enum(["weekly","semi_monthly","monthly","quarterly"]).optional(),
  rounding:z.enum(["half_up","down","up"]).optional(), referenceStrategy:z.enum(["manual","sequence"]).optional(), referencePrefix:z.string().trim().max(20).optional(), active:z.coerce.boolean().default(true),
});

export const loanSchema = z.object({ employeeId:z.string().uuid(), loanTypeId:z.string().uuid(), loanNumber:z.string().trim().min(1).max(80), principal:moneyStringSchema, startDate:z.iso.date(), maturityDate:z.iso.date().optional().or(z.literal("")).transform(v=>v||null), term:z.coerce.number().int().positive().max(600), rate:z.string().trim().regex(/^\d+(?:\.\d{1,6})?$/), frequency:z.enum(["weekly","semi_monthly","monthly","quarterly"]), strategy:z.enum(["manual","zero_interest","flat_percentage"]), rounding:z.enum(["half_up","down","up"]), source:z.enum(["manual","system"]), scheduleJson:z.string().trim().min(2) });
export const paymentSchema=z.object({loanId:z.string().uuid(),transactionTypeId:z.string().uuid(),date:z.iso.date(),amount:moneyStringSchema,reference:optional,notes:optional});
export const rebateSchema=z.object({employeeId:z.string().uuid(),rebateTypeId:z.string().uuid(),loanId:z.string().uuid().optional().or(z.literal("")).transform(v=>v||null),date:z.iso.date(),amount:moneyStringSchema,calculatedAmount:z.string().optional(),source:z.enum(["manual","system"]),overrideReason:optional,reason:optional,reference:optional});
