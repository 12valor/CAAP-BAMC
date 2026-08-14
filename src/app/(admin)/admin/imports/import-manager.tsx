"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { applyImportMappingAction, confirmImportAction } from "./actions";
type Job = {
  id: string;
  source_filename: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  created_at: string;
  completed_at: string | null;
  summary: unknown;
};
type Row = {
  id: string;
  row_number: number;
  entity_type: string | null;
  status: string;
  normalized_data: unknown;
  error_message: string | null;
  warning_message: string | null;
};
export function ImportManager({
  jobs,
  rows,
  selectedJobId,
}: {
  jobs: Job[];
  rows: Row[];
  selectedJobId?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const job = jobs.find((j) => j.id === selectedJobId);
  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) return toast.error("Choose an .xlsx workbook.");
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const response = await fetch("/api/imports/upload", {
      method: "POST",
      body: fd,
    });
    const result = await response.json();
    setUploading(false);
    if (!response.ok) return toast.error(result.error);
    router.push(`/admin/imports?job=${result.jobId}`);
    router.refresh();
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Excel imports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Validate and confirm before importing.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/imports/template">
            <Download />
            Download template
          </a>
        </Button>
      </header>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Upload workbook</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            ref={input}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
          <Button onClick={upload} disabled={uploading}>
            <Upload />
            {uploading ? "Validating…" : "Upload for preview"}
          </Button>
        </div>
      </section>
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="font-semibold">Import history</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No import jobs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid rows</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      item.id === selectedJobId ? "bg-primary/5" : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      {item.source_filename}
                    </TableCell>
                    <TableCell className="capitalize">
                      {item.status.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      {item.valid_rows} / {item.total_rows}
                    </TableCell>
                    <TableCell>{item.error_rows}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/imports?job=${item.id}`}>
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
        <main className="space-y-4">
          {!job ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <FileSpreadsheet className="mx-auto mb-2 size-10 text-muted-foreground" />
              Upload a template to begin.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div>
                  <h2 className="font-semibold">{job.source_filename}</h2>
                  <p className="text-sm text-muted-foreground">
                    {job.valid_rows} valid · {job.error_rows} errors · status:{" "}
                    {job.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href={`/api/imports/${job.id}/errors`}>
                      <Download />
                      Error report
                    </a>
                  </Button>
                  <form
                    action={(fd) =>
                      startTransition(async () => {
                        const r = await confirmImportAction(fd);
                        if (r.error) toast.error(r.error);
                        else toast.success(r.success);
                      })
                    }
                  >
                    <input type="hidden" name="jobId" value={job.id} />
                    <Button disabled={pending || job.status !== "ready"}>
                      Confirm import
                    </Button>
                  </form>
                </div>
              </div>
              {job.error_rows > 0 && (
                <form
                  action={(fd) =>
                    startTransition(async () => {
                      const r = await applyImportMappingAction(fd);
                      if (r.error) toast.error(r.error);
                      else toast.success(r.success);
                    })
                  }
                  className="grid gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 md:grid-cols-4"
                >
                  <input type="hidden" name="jobId" value={job.id} />
                  <select
                    name="field"
                    className="h-10 rounded-lg border bg-white px-3"
                  >
                    <option value="type_code">Transaction type</option>
                    <option value="transaction_type_code">
                      Loan payment transaction type
                    </option>
                    <option value="loan_type_code">Loan type</option>
                    <option value="rebate_type_code">Rebate type</option>
                    <option value="leave_type_code">Leave type</option>
                    <option value="category_code">Document category</option>
                  </select>
                  <Input name="from" placeholder="Unknown code" />
                  <Input name="to" placeholder="Existing active code" />
                  <Button variant="outline" disabled={pending}>
                    Apply explicit mapping
                  </Button>
                </form>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="align-top">
                      <TableCell>{row.row_number}</TableCell>
                      <TableCell>{row.entity_type}</TableCell>
                      <TableCell className="font-medium capitalize">
                        {row.status.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell className="max-w-xl whitespace-normal">
                        <span className="text-destructive">
                          {row.error_message}
                        </span>
                        <span className="text-amber-700">
                          {row.warning_message}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
