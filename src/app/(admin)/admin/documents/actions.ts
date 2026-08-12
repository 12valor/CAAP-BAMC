"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { databaseActionError, type AdminActionResult } from "@/lib/admin-action";
import { documentArchiveSchema, documentUpdateSchema, documentUploadSchema, hasAllowedFileSignature } from "@/validation/documents";

export type PrepareUploadResult = AdminActionResult & { documentId?: string; path?: string; maxBytes?: number };
const value = (data: FormData, key: string) => String(data.get(key) ?? "");

async function documentLimit() {
  const admin = createAdminClient();
  const { data } = await admin.from("system_settings").select("setting_value").eq("setting_key", "documents.max_file_size_bytes").maybeSingle();
  const setting = data?.setting_value as { value?: number } | null;
  return setting?.value ?? 26_214_400;
}

export async function prepareDocumentUploadAction(data: FormData): Promise<PrepareUploadResult> {
  await requireRole("admin");
  const parsed = documentUploadSchema.safeParse({ employeeId: value(data,"employeeId"), categoryId: value(data,"categoryId"), filename: value(data,"filename"), mimeType: value(data,"mimeType"), sizeBytes: value(data,"sizeBytes"), documentDate: value(data,"documentDate"), employeeVisible: value(data,"employeeVisible") === "true" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid file." };
  const maxBytes = await documentLimit();
  if (parsed.data.sizeBytes > maxBytes) return { error: `The file exceeds the configured ${Math.round(maxBytes/1_048_576)} MB limit.` };
  const extension = parsed.data.mimeType === "application/pdf" ? "pdf" : parsed.data.mimeType === "image/png" ? "png" : "jpg";
  const path = `objects/${randomUUID()}/${randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("manage_document", { operation: "prepare", payload: { employee_id: parsed.data.employeeId, document_category_id: parsed.data.categoryId, storage_object_path: path, original_filename: parsed.data.filename, mime_type: parsed.data.mimeType, size_bytes: parsed.data.sizeBytes, document_date: parsed.data.documentDate || null, is_employee_visible: parsed.data.employeeVisible } });
  if (error || !id) return { error: databaseActionError(error, "Upload could not be prepared.") };
  return { success: "Upload prepared.", documentId: id, path, maxBytes };
}

export async function finalizeDocumentUploadAction(documentId: string): Promise<AdminActionResult> {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: document, error: documentError } = await admin.from("documents").select("storage_object_path,mime_type,size_bytes").eq("id",documentId).eq("status","pending").single();
  if (documentError || !document) return { error: "Pending upload was not found." };
  const { data: file, error: downloadError } = await admin.storage.from("employee-documents").download(document.storage_object_path);
  if (downloadError || !file) return { error: "The uploaded object could not be verified. Retry the upload." };
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.size !== document.size_bytes || !hasAllowedFileSignature(bytes, document.mime_type)) {
    await admin.storage.from("employee-documents").remove([document.storage_object_path]);
    await (await createClient()).rpc("manage_document", { operation: "fail", target_id: documentId, payload: { message: "File signature or size did not match the prepared upload." } });
    return { error: "File verification failed. The uploaded object was removed; you can retry." };
  }
  const { error } = await (await createClient()).rpc("manage_document", { operation: "finalize", target_id: documentId });
  if (error) return { error: databaseActionError(error, "Upload could not be finalized.") };
  revalidatePath("/admin/documents"); revalidatePath("/portal/documents");
  return { success: "Document uploaded and verified." };
}

export async function markDocumentUploadFailedAction(documentId: string, message: string) {
  await requireRole("admin");
  await (await createClient()).rpc("manage_document", { operation: "fail", target_id: documentId, payload: { message } });
}

export async function retryDocumentUploadAction(documentId:string, file:{name:string;type:string;size:number}):Promise<PrepareUploadResult>{
  await requireRole("admin"); const admin=createAdminClient(); const{data:document}=await admin.from("documents").select("storage_object_path,original_filename,mime_type,size_bytes,status,deleted_at").eq("id",documentId).maybeSingle();
  if(!document||document.deleted_at||document.status!=="pending")return{error:"This upload is no longer pending."};
  if(file.name!==document.original_filename||file.type!==document.mime_type||file.size!==document.size_bytes)return{error:"Choose the same file name, type, and size for recovery."};
  const{error}=await (await createClient()).rpc("manage_document",{operation:"retry",target_id:documentId});if(error)return{error:databaseActionError(error,"Upload retry could not be prepared.")};
  return{success:"Retry prepared.",documentId,path:document.storage_object_path,maxBytes:await documentLimit()};
}

export async function updateDocumentAction(data: FormData): Promise<AdminActionResult> {
  await requireRole("admin");
  const parsed = documentUpdateSchema.safeParse({ documentId:value(data,"documentId"),filename:value(data,"filename"),categoryId:value(data,"categoryId"),documentDate:value(data,"documentDate"),employeeVisible:value(data,"employeeVisible")==="true",reason:value(data,"reason") });
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Invalid document update."};
  const {error}=await (await createClient()).rpc("manage_document",{operation:"update",target_id:parsed.data.documentId,payload:{original_filename:parsed.data.filename,document_category_id:parsed.data.categoryId,document_date:parsed.data.documentDate||null,is_employee_visible:parsed.data.employeeVisible},change_reason:parsed.data.reason});
  if(error)return{error:databaseActionError(error,"Document could not be updated.")}; revalidatePath("/admin/documents"); return{success:"Document metadata updated and audited."};
}

export async function archiveDocumentAction(data: FormData): Promise<AdminActionResult> {
  await requireRole("admin");
  const parsed=documentArchiveSchema.safeParse({documentId:value(data,"documentId"),operation:value(data,"operation"),reason:value(data,"reason")});
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Invalid archive request."};
  const {error}=await (await createClient()).rpc("manage_document",{operation:parsed.data.operation,target_id:parsed.data.documentId,change_reason:parsed.data.reason});
  if(error)return{error:databaseActionError(error,"Document archive status could not be changed.")}; revalidatePath("/admin/documents"); return{success:parsed.data.operation==="restore"?"Document restored.":"Document archived. The private object was retained."};
}

export async function updateDocumentLimitAction(data:FormData):Promise<AdminActionResult>{
  const principal=await requireRole("admin");const megabytes=Number(data.get("megabytes"));if(!Number.isInteger(megabytes)||megabytes<1||megabytes>50)return{error:"Set a whole-number limit from 1 to 50 MB."};
  const supabase=await createClient();const{error}=await supabase.from("system_settings").update({setting_value:{value:megabytes*1_048_576,maximum:52_428_800,resumable_threshold:6_291_456},updated_by:principal.id}).eq("setting_key","documents.max_file_size_bytes");
  if(error)return{error:databaseActionError(error,"Document upload limit could not be updated.")};revalidatePath("/admin/documents");return{success:`Document upload limit set to ${megabytes} MB and audited.`};
}
