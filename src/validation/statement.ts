import { z } from "zod";

export const statementFilterSchema = z
  .object({
    start: z.iso.date().optional(),
    end: z.iso.date().optional(),
    category: z.uuid().optional(),
  })
  .refine(({ start, end }) => !start || !end || start <= end, {
    message: "The start date must not be after the end date.",
    path: ["end"],
  });

export function parseStatementFilters(
  values: Record<string, string | undefined>,
) {
  return statementFilterSchema.safeParse({
    start: values.start || undefined,
    end: values.end || undefined,
    category: values.category || undefined,
  });
}
