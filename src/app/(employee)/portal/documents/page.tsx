import type { Metadata } from "next";
import { FileText, FolderOpen } from "lucide-react";
import { requireRole } from "@/lib/permissions/authorization";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata:Metadata={title:"My Documents"};
export default async function PortalDocumentsPage(){
  await requireRole("employee"); const supabase=await createClient();
  const{data}=await supabase.from("documents").select("id,original_filename,mime_type,size_bytes,document_date,created_at,document_categories(name)").eq("status","available").order("created_at",{ascending:false});
  return <div className="space-y-6"><header className="border-b pb-5"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Employee self-service</p><h1 className="text-3xl font-bold">My documents</h1><p className="mt-2 text-muted-foreground">Only files authorized for your employee profile appear here. Links expire after five minutes.</p></header>{!data?.length?<div className="rounded-xl border border-dashed p-12 text-center"><FolderOpen className="mx-auto mb-3 size-10 text-muted-foreground"/><h2 className="font-semibold">No authorized documents</h2><p className="text-sm text-muted-foreground">Your bookkeeper has not shared any files yet.</p></div>:<div className="divide-y rounded-xl border bg-card">{data.map(d=><article key={d.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-3"><FileText className="size-6 shrink-0 text-primary"/><div><h2 className="truncate font-semibold">{d.original_filename}</h2><p className="text-sm text-muted-foreground">{d.document_categories?.name??"Document"} · {Math.ceil(d.size_bytes/1024)} KB · {d.document_date??new Date(d.created_at).toLocaleDateString()}</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" asChild><a href={`/api/documents/${d.id}`} target="_blank">Preview</a></Button><Button variant="outline" size="sm" asChild><a href={`/api/documents/${d.id}?download=1`}>Download</a></Button></div></article>)}</div>}</div>;
}
