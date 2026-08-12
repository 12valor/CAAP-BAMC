import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

export const employeeRecordSchema = z.object({
  employeeId: z.string().uuid().optional(),
  employeeNumber: z.string().trim().min(1, "Employee number is required.").max(40),
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  middleName: optionalText(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  suffix: optionalText(30),
  department: optionalText(120),
  positionTitle: optionalText(120),
  employmentCategory: z.string().trim().min(1).max(80),
  employmentStatus: z.enum(["active", "inactive", "separated", "retired"]),
  emailAddress: z.union([z.literal(""), z.string().trim().email()]).transform((value) => value || null),
  mobileNumber: optionalText(40),
  addressText: optionalText(500),
  notes: optionalText(2000),
});

export const employeeArchiveSchema = z.object({
  employeeId: z.string().uuid(),
  operation: z.enum(["archive", "restore"]),
  reason: z.string().trim().min(5, "Provide a reason of at least 5 characters.").max(500),
});

export const employeeListSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: z.string().trim().max(40).catch(""),
  department: z.string().trim().max(120).catch(""),
  category: z.string().trim().max(80).catch(""),
  archived: z.enum(["true", "false"]).catch("false"),
  cursorKey: z.string().max(500).optional(),
  cursorId: z.string().uuid().optional(),
});

export type EmployeeRecordInput = z.input<typeof employeeRecordSchema>;
