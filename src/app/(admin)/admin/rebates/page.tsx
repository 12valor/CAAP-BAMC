import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { RebateManager, type RebateRow } from "./rebate-manager";
export const metadata: Metadata = { title: "Rebates" };
export default async function RebatesPage() { await requireRole("admin"); const { data, error } = await createAdminClient().from("rebates").select("id,employee_id,rebate_type_id,loan_id,transaction_id,rebate_date,amount,status,reason,calculation_source,calculated_amount,override_reason,employee_profiles(employee_number,first_name,last_name),rebate_types(code,name)").is("deleted_at", null).order("rebate_date", { ascending: false }).limit(200); if (error) throw new Error("Unable to load rebate records."); return <div className="space-y-6"><PageHeader title="Rebates" /><RebateManager rebates={(data ?? []) as unknown as RebateRow[]} /></div>; }
