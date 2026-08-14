import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminTableFrame } from "@/components/admin/admin-table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type RebateRow = { id: string; employee_id: string; rebate_date: string; amount: number; status: string; reason: string | null; calculation_source: string; calculated_amount: number | null; override_reason: string | null; transaction_id: string | null; employee_profiles: { employee_number: string; first_name: string; last_name: string } | null; rebate_types: { code: string; name: string } | null };
export function RebateManager({ rebates }: { rebates: RebateRow[] }) {
  return <AdminTableFrame><div className="flex items-center justify-between border-b bg-muted/20 p-4"><p className="text-sm font-medium">{rebates.length} rebates shown</p><Button asChild><Link href="/admin/rebates/new"><Plus />Add rebate</Link></Button></div>{rebates.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Source</TableHead><TableHead>Ledger</TableHead></TableRow></TableHeader><TableBody>{rebates.map((rebate) => <TableRow key={rebate.id}><TableCell>{rebate.rebate_date}</TableCell><TableCell>{rebate.employee_profiles?.first_name} {rebate.employee_profiles?.last_name}<p className="text-sm text-muted-foreground">{rebate.employee_profiles?.employee_number}</p></TableCell><TableCell>{rebate.rebate_types?.code} · {rebate.rebate_types?.name}</TableCell><TableCell className="text-right">₱{Number(rebate.amount).toLocaleString()}</TableCell><TableCell><Badge variant={rebate.calculation_source === "system" ? "success" : "secondary"}>{rebate.calculation_source === "system" ? "System" : "Manual"}</Badge></TableCell><TableCell>{rebate.transaction_id ? "Linked" : "No effect"}</TableCell></TableRow>)}</TableBody></Table></div> : <p className="p-10 text-center text-sm text-muted-foreground">No rebates recorded.</p>}</AdminTableFrame>;
}
