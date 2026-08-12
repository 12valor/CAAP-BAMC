import { NextResponse } from "next/server";
import { getCurrentPrincipal } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request:Request,{params}:{params:Promise<{documentId:string}>}){
  const principal=await getCurrentPrincipal(); if(!principal)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {documentId}=await params; const admin=createAdminClient(); const{data:document}=await admin.from("documents").select("employee_id,storage_object_path,original_filename,is_employee_visible,status,deleted_at").eq("id",documentId).maybeSingle();
  if(!document||document.deleted_at||document.status!=="available"||(principal.role==="employee"&&(document.employee_id!==principal.employeeId||!document.is_employee_visible)))return NextResponse.json({error:"Not found"},{status:404});
  const download=new URL(request.url).searchParams.get("download")==="1"; const{data,error}=await admin.storage.from("employee-documents").createSignedUrl(document.storage_object_path,300,{download:download?document.original_filename:false});
  if(error||!data)return NextResponse.json({error:"Unable to create a secure link"},{status:500}); return NextResponse.redirect(data.signedUrl);
}
