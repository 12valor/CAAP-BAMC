import { NextResponse } from "next/server";

import { getCurrentPrincipal } from "@/lib/permissions/authorization";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const principal = await getCurrentPrincipal();
  if (!principal)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("storage_object_path,original_filename")
    .eq("id", documentId)
    .maybeSingle();
  if (!document)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const { data, error } = await supabase.storage
    .from("employee-documents")
    .createSignedUrl(document.storage_object_path, 300, {
      download: download ? document.original_filename : false,
    });
  if (error || !data)
    return NextResponse.json(
      { error: "Unable to create a secure link" },
      { status: 500 },
    );
  return NextResponse.redirect(data.signedUrl);
}
