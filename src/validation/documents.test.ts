import { describe, expect, it } from "vitest";
import { documentUploadSchema, hasAllowedFileSignature } from "./documents";

describe("document validation", () => {
  it("accepts only supported files and verifies signatures", () => {
    expect(documentUploadSchema.safeParse({ employeeId: crypto.randomUUID(), categoryId: crypto.randomUUID(), filename: "record.pdf", mimeType: "application/pdf", sizeBytes: 10, employeeVisible: true }).success).toBe(true);
    expect(hasAllowedFileSignature(new TextEncoder().encode("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(hasAllowedFileSignature(new TextEncoder().encode("<html>"), "application/pdf")).toBe(false);
  });
});
