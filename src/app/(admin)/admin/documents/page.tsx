import type { Metadata } from "next";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { DocumentArchive } from "./document-archive";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  await requireRole("admin");
  const params=await searchParams; const admin=createAdminClient();
  const [{data:employees},{data:categories},{data:documents},{data:limitSetting}]=await Promise.all([
    admin.from("employee_profiles").select("id,employee_number,first_name,middle_name,last_name").is("deleted_at",null).order("last_name").limit(1000),
    admin.from("document_categories").select("id,code,name").eq("is_active",true).is("deleted_at",null).order("sort_order"),
    params.employee ? admin.from("documents").select("id,employee_id,document_category_id,original_filename,mime_type,size_bytes,document_date,is_employee_visible,status,metadata,created_at,deleted_at,upload_error").eq("employee_id",params.employee).order("created_at",{ascending:false}).limit(500) : Promise.resolve({data:[]}),
    admin.from("system_settings").select("setting_value").eq("setting_key","documents.max_file_size_bytes").maybeSingle(),
  ]);
  const limit=limitSetting?.setting_value as {value?:number}|null;
  return <DocumentArchive employees={employees??[]} categories={categories??[]} documents={documents??[]} selectedEmployee={params.employee} selectedCategory={params.category} initialView={params.view==="list"?"list":"grid"} query={params.q??""} maxMegabytes={Math.round((limit?.value??26_214_400)/1_048_576)}/>;
}
