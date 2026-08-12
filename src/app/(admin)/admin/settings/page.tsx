import type { Metadata } from "next";
import { FinancialSettingsManager, type SettingRow } from "./settings-manager";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Financial Settings" };
export default async function SettingsPage(){
 await requireRole("admin"); const admin=createAdminClient();
 const kinds=["financial_categories","transaction_types","interest_methods","penalty_rules","loan_types","rebate_types"] as const;
 const results=await Promise.all(kinds.map(kind=>admin.from(kind).select("*").is("deleted_at",null).order("name")));
 if(results.some(r=>r.error))throw new Error("Unable to load financial settings.");
 const groups=Object.fromEntries(kinds.map((kind,index)=>[kind,results[index].data??[]])) as Record<string,SettingRow[]>;
 return <div className="space-y-6"><PageHeader eyebrow="Administrator workspace" preview={false} title="Configurable financial settings" description="Maintain debit and credit types, loan and rebate rules, effective dates, and safe structured calculation options."/><FinancialSettingsManager groups={groups}/></div>;
}
