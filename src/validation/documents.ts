import { z } from "zod";

export const allowedDocumentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const documentUploadSchema = z.object({
  employeeId: z.uuid(),
  categoryId: z.uuid(),
  filename: z.string().trim().min(1).max(180),
  mimeType: z.enum(allowedDocumentMimeTypes),
  sizeBytes: z.coerce.number().int().positive(),
  documentDate: z.iso.date().optional().or(z.literal("")),
  employeeVisible: z.coerce.boolean().default(false),
});

export const documentUpdateSchema = z.object({
  documentId: z.uuid(),
  filename: z.string().trim().min(1).max(180),
  categoryId: z.uuid(),
  documentDate: z.iso.date().optional().or(z.literal("")),
  employeeVisible: z.coerce.boolean().default(false),
  reason: z.string().trim().min(5).max(500),
});

export const documentArchiveSchema = z.object({
  documentId: z.uuid(),
  operation: z.enum(["soft_delete", "restore"]),
  reason: z.string().trim().min(5).max(500),
});

export function hasAllowedFileSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (mimeType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}
