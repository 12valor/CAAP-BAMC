"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  saveFinancialSettingAction,
  setFinancialSettingStatusAction,
} from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export type SettingRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  strategy?: string;
  calculation_strategy?: string;
  direction?: string;
  balance_effect?: string;
  effective_from?: string | null;
  effective_to?: string | null;
  financial_category_id?: string;
  default_rate?: number | null;
  percentage_rate?: number | null;
  fixed_amount?: number | null;
  default_term_count?: number | null;
  installment_frequency?: string;
  rounding_method?: string;
  reference_strategy?: string;
  reference_prefix?: string | null;
};
const labels: Record<string, string> = {
  financial_categories: "Financial categories",
  transaction_types: "Debit and credit transaction types",
  interest_methods: "Interest methods",
  penalty_rules: "Penalty rules",
  loan_types: "Loan types",
  rebate_types: "Rebate types",
};
export function FinancialSettingsManager({
  groups,
}: {
  groups: Record<string, SettingRow[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<{
    kind: string;
    row?: SettingRow;
  } | null>(null);
  function run(
    action: (d: FormData) => Promise<{ error?: string; success?: string }>,
    data: FormData,
    done?: () => void,
  ) {
    startTransition(async () => {
      const r = await action(data);
      r.error ? toast.error(r.error) : toast.success(r.success);
      if (!r.error) {
        done?.();
        router.refresh();
      }
    });
  }
  const categories = groups.financial_categories ?? [];
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {Object.entries(groups).map(([kind, rows]) => (
        <Card key={kind}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{labels[kind]}</CardTitle>
            <Button size="sm" onClick={() => setEditing({ kind })}>
              <Plus />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {rows.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code and name</TableHead>
                    <TableHead>Strategy / effective date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="font-medium">{row.code}</span> ·{" "}
                        {row.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {row.direction ??
                          row.strategy ??
                          row.calculation_strategy ??
                          "structured"}
                        <small className="block text-muted-foreground">
                          {row.effective_from ?? "No start date"}
                        </small>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.is_active ? "success" : "secondary"}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditing({ kind, row })}
                          >
                            <Pencil />
                            Edit
                          </Button>
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              run(
                                setFinancialSettingStatusAction,
                                new FormData(event.currentTarget),
                              );
                            }}
                          >
                            <input type="hidden" name="kind" value={kind} />
                            <input type="hidden" name="id" value={row.id} />
                            <input
                              type="hidden"
                              name="active"
                              value={String(!row.is_active)}
                            />
                            <Button size="sm" variant="outline">
                              {row.is_active ? "Disable" : "Enable"}
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-muted-foreground">
                No settings yet.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                saveFinancialSettingAction,
                new FormData(e.currentTarget),
                () => setEditing(null),
              );
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editing?.row ? "Edit" : "Add"}{" "}
                {editing ? labels[editing.kind] : "setting"}
              </DialogTitle>
              <DialogDescription>
                Only validated structured strategies are stored. Executable
                formulas are not accepted.
              </DialogDescription>
            </DialogHeader>
            <input type="hidden" name="kind" value={editing?.kind} />
            <input type="hidden" name="id" value={editing?.row?.id} />
            <input
              type="hidden"
              name="active"
              value={String(editing?.row?.is_active ?? true)}
            />
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input name="code" required defaultValue={editing?.row?.code} />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" required defaultValue={editing?.row?.name} />
              </div>
              {editing?.kind === "transaction_types" && (
                <>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      name="financialCategoryId"
                      defaultValue={editing.row?.financial_category_id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      name="direction"
                      defaultValue={editing.row?.direction ?? "debit"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference numbering</Label>
                    <Select
                      name="referenceStrategy"
                      defaultValue={editing.row?.reference_strategy ?? "manual"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="sequence">
                          Automatic sequence
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference prefix</Label>
                    <Input
                      name="referencePrefix"
                      defaultValue={editing.row?.reference_prefix ?? ""}
                    />
                  </div>
                </>
              )}
              {!["financial_categories", "transaction_types"].includes(
                editing?.kind ?? "",
              ) && (
                <>
                  <div className="space-y-2">
                    <Label>Calculation strategy</Label>
                    <Input
                      name="strategy"
                      defaultValue={
                        editing?.row?.strategy ??
                        editing?.row?.calculation_strategy ??
                        "manual"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage / rate</Label>
                    <Input
                      name="percentage"
                      inputMode="decimal"
                      defaultValue={
                        editing?.row?.default_rate ??
                        editing?.row?.percentage_rate ??
                        ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fixed amount</Label>
                    <Input
                      name="fixedAmount"
                      inputMode="decimal"
                      defaultValue={editing?.row?.fixed_amount ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Term length</Label>
                    <Input
                      name="termLength"
                      type="number"
                      min="1"
                      defaultValue={editing?.row?.default_term_count ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Installment frequency</Label>
                    <Select
                      name="frequency"
                      defaultValue={
                        editing?.row?.installment_frequency ?? "monthly"
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["weekly", "semi_monthly", "monthly", "quarterly"].map(
                          (v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rounding</Label>
                    <Select
                      name="rounding"
                      defaultValue={editing?.row?.rounding_method ?? "half_up"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["half_up", "down", "up"].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Balance effect</Label>
                <Select
                  name="balanceEffect"
                  defaultValue={
                    editing?.kind === "transaction_types"
                      ? editing.row?.direction === "credit"
                        ? "decrease"
                        : "increase"
                      : (editing?.row?.balance_effect ?? "neutral")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["increase", "decrease", "neutral"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Effective from</Label>
                <Input
                  name="effectiveFrom"
                  type="date"
                  defaultValue={editing?.row?.effective_from ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective to</Label>
                <Input
                  name="effectiveTo"
                  type="date"
                  defaultValue={editing?.row?.effective_to ?? ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button disabled={pending}>
                {pending ? "Saving…" : "Save setting"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
