import type { Metadata } from "next";
import { FileText, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/permissions/authorization";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My Documents" };

export default async function PortalDocumentsPage() {
  await requireRole("employee");
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id,original_filename,mime_type,size_bytes,document_date,created_at,document_categories(name)",
    )
    .eq("status", "available")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header className="border-b pb-5">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          Employee self-service
        </p>
        <h1 className="text-3xl font-bold">My documents</h1>
        <p className="mt-2 text-muted-foreground">
          Only files authorized for your employee profile appear here. Links
          expire after five minutes.
        </p>
      </header>

      {!data?.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FolderOpen className="mx-auto mb-3 size-10 text-muted-foreground" />
          <h2 className="font-semibold">No authorized documents</h2>
          <p className="text-sm text-muted-foreground">
            Your bookkeeper has not shared any files yet.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex min-w-64 items-center gap-3">
                    <FileText className="size-5 shrink-0 text-primary" />
                    <span className="max-w-80 truncate font-medium">
                      {document.original_filename}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {document.document_categories?.name ?? "Document"}
                </TableCell>
                <TableCell>
                  {document.document_date ??
                    new Date(document.created_at).toLocaleDateString("en-PH")}
                </TableCell>
                <TableCell>
                  {Math.ceil(document.size_bytes / 1024).toLocaleString()} KB
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/documents/${document.id}`} target="_blank">
                        Preview
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/documents/${document.id}?download=1`}>
                        Download
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
