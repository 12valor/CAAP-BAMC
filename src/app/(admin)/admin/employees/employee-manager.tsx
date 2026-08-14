import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";

import { AdminTableFrame, AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type EmployeeRow = {
  id: string;
  employee_number: string;
  complete_name: string;
  department: string | null;
  position_title: string | null;
  employment_status: string;
  employment_category: string;
  email_address: string | null;
  mobile_number: string | null;
  deleted_at: string | null;
  profile_id: string | null;
  username: string | null;
  account_status: string | null;
  sort_key: string;
  transaction_count: number;
  active_loan_count: number;
  leave_balance_count: number;
  document_count: number;
};

type Filters = {
  q: string;
  status: string;
  department: string;
  category: string;
  archived: "true" | "false";
  cursorKey?: string;
  cursorId?: string;
};

export function EmployeeManager({
  rows,
  hasNext,
  filters,
  departments,
  categories,
}: {
  rows: EmployeeRow[];
  hasNext: boolean;
  filters: Filters;
  departments: string[];
  categories: string[];
}) {
  const next = rows.at(-1);
  return (
    <AdminTableFrame>
      <AdminTableToolbar>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{rows.length} employees shown</p>
          <Button asChild>
            <Link href="/admin/employees/new"><Plus />Add employee</Link>
          </Button>
        </div>
        <form className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)_auto]" method="get">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input name="q" defaultValue={filters.q} className="pl-9" placeholder="Search employees" />
          </div>
          <FilterSelect name="status" value={filters.status || "all"} label="All statuses" options={["active", "inactive", "separated", "retired"]} />
          <FilterSelect name="department" value={filters.department || "all"} label="All departments" options={departments} />
          <FilterSelect name="category" value={filters.category || "all"} label="All categories" options={categories} />
          <FilterSelect name="archived" value={filters.archived} label="Current only" options={["true"]} optionLabels={{ true: "Include archived" }} />
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </AdminTableToolbar>
      {rows.length ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Records</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className={row.deleted_at ? "opacity-60" : ""}>
                  <TableCell><p className="font-medium">{row.complete_name}</p><p className="text-sm text-muted-foreground">{row.employee_number}</p></TableCell>
                  <TableCell>{row.department ?? "—"}<p className="text-sm text-muted-foreground">{row.position_title ?? "—"}</p></TableCell>
                  <TableCell><Badge variant={row.deleted_at ? "secondary" : row.employment_status === "active" ? "success" : "warning"}>{row.deleted_at ? "Archived" : row.employment_status}</Badge></TableCell>
                  <TableCell className="text-sm">{row.transaction_count} transactions · {row.active_loan_count} loans<br />{row.document_count} documents</TableCell>
                  <TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/employees/${row.id}`}><Eye />View</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : <p className="p-10 text-center text-sm text-muted-foreground">No employees found.</p>}
      <div className="flex items-center justify-end gap-2 border-t p-4">
        <Button asChild variant="outline"><Link href="/admin/employees">First page</Link></Button>
        {hasNext && next ? <Button asChild><Link href={{ pathname: "/admin/employees", query: { q: filters.q, status: filters.status, department: filters.department, category: filters.category, archived: filters.archived, cursorKey: next.sort_key, cursorId: next.id } }}>Next 25</Link></Button> : null}
      </div>
    </AdminTableFrame>
  );
}

function FilterSelect({ name, value, label, options, optionLabels = {} }: { name: string; value: string; label: string; options: string[]; optionLabels?: Record<string, string> }) {
  return <Select name={name} defaultValue={value}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={name === "archived" ? "false" : "all"}>{label}</SelectItem>{options.map((option) => <SelectItem key={option} value={option}>{optionLabels[option] ?? option}</SelectItem>)}</SelectContent></Select>;
}
