/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditDifferences } from "./format";
import type { ReportColumn, ReportFilters, ReportPage, ReportRow } from "./types";

const PAGE_SIZE = 50;
type AnyQuery = any;

function relationName(value: unknown, fallback = "Unknown") {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== "object") return fallback;
  const row = item as Record<string, unknown>;
  return String(row.name ?? row.display_name ?? ([row.first_name, row.last_name].filter(Boolean).join(" ") || fallback));
}

function employeeLabel(value: unknown) {
  const item = (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  if (!item) return "Unknown employee";
  return `${item.employee_number ?? ""} - ${[item.first_name, item.last_name].filter(Boolean).join(" ")}`.trim();
}

function cursor(query: AnyQuery, filters: ReportFilters, key: string) {
  if (!filters.cursorKey || !filters.cursorId) return query;
  return query.or(`${key}.lt.${filters.cursorKey},and(${key}.eq.${filters.cursorKey},id.lt.${filters.cursorId})`);
}

function finish(title: string, description: string, columns: ReportColumn[], data: unknown[] | null, key: string, map: (row: any) => ReportRow): ReportPage {
  const source = data ?? [];
  const hasNext = source.length > PAGE_SIZE;
  const rows = source.slice(0, PAGE_SIZE).map(map);
  const last = rows.at(-1);
  return { title, description, columns, rows, nextCursor: hasNext && last ? { key: String(last[key]), id: last.id } : undefined };
}

export async function loadReport(filters: ReportFilters, limit = PAGE_SIZE + 1): Promise<ReportPage> {
  const db = createAdminClient();
  const take = Math.min(Math.max(limit, 1), 25_001);
  let query: AnyQuery;
  let result: { data: unknown[] | null; error: { message: string } | null };

  if (filters.report === "ledger" || filters.report === "statement") {
    if (filters.report === "statement" && !filters.employee) {
      return { title: "Employee Statement of Account", description: "Select an employee to generate a statement.", columns: [], rows: [] };
    }
    query = db.from("transactions").select("id,transaction_date,reference_number,direction,amount,status,description,employee_id,employee_profiles(employee_number,first_name,last_name),transaction_types(name,financial_categories(name))")
      .is("deleted_at", null).order("transaction_date", { ascending: false }).order("id", { ascending: false }).limit(take);
    if (filters.employee) query = query.eq("employee_id", filters.employee);
    if (filters.start) query = query.gte("transaction_date", filters.start);
    if (filters.end) query = query.lte("transaction_date", filters.end);
    if (filters.status) query = query.eq("status", filters.status);
    query = cursor(query, filters, "transaction_date"); result = await query;
    if (result.error) throw new Error("Unable to load ledger report.");
    const columns: ReportColumn[] = [
      { key: "transaction_date", label: "Date", kind: "date" }, { key: "employee", label: "Employee" },
      { key: "reference_number", label: "Reference" }, { key: "type", label: "Type" },
      { key: "direction", label: "Direction" }, { key: "amount", label: "Amount", kind: "money" }, { key: "status", label: "Status" },
    ];
    return finish(filters.report === "statement" ? "Employee Statement of Account" : "Debit / credit ledger",
      filters.report === "statement" ? "Posted and current ledger entries for the selected employee and period." : "Debit and credit activity using server-side filters.",
      columns, result.data, "transaction_date", (r) => ({ id:r.id, transaction_date:r.transaction_date, employee:employeeLabel(r.employee_profiles), reference_number:r.reference_number, type:relationName(r.transaction_types), direction:r.direction, amount:String(r.amount), status:r.status }));
  }

  if (filters.report === "loan-balances") {
    query=db.from("loans").select("id,start_date,account_number,principal_amount,total_payable_amount,status,employee_id,employee_profiles(employee_number,first_name,last_name),loan_types(name)").is("deleted_at",null).order("start_date",{ascending:false}).order("id",{ascending:false}).limit(take);
    if(filters.employee)query=query.eq("employee_id",filters.employee);if(filters.start)query=query.gte("start_date",filters.start);if(filters.end)query=query.lte("start_date",filters.end);if(filters.status)query=query.eq("status",filters.status);query=cursor(query,filters,"start_date");result=await query;if(result.error)throw new Error("Unable to load loan balances.");
    return finish("Loan balances","Original principal and configured total payable; scheduled outstanding remains provisional.",[{key:"start_date",label:"Start",kind:"date"},{key:"employee",label:"Employee"},{key:"loan_type",label:"Loan type"},{key:"account_number",label:"Account"},{key:"principal_amount",label:"Original principal",kind:"money"},{key:"total_payable_amount",label:"Total payable",kind:"money"},{key:"status",label:"Status"}],result.data,"start_date",r=>({id:r.id,start_date:r.start_date,employee:employeeLabel(r.employee_profiles),loan_type:relationName(r.loan_types),account_number:r.account_number,principal_amount:String(r.principal_amount),total_payable_amount:String(r.total_payable_amount??r.principal_amount),status:r.status}));
  }

  if(filters.report==="loan-schedules"){
    query=db.from("loan_schedules").select("id,due_date,installment_number,principal_due,interest_due,penalty_due,other_due,total_due,paid_amount,status,loans(account_number,employee_id,employee_profiles(employee_number,first_name,last_name),loan_types(name))").is("deleted_at",null).order("due_date",{ascending:false}).order("id",{ascending:false}).limit(take);if(filters.start)query=query.gte("due_date",filters.start);if(filters.end)query=query.lte("due_date",filters.end);if(filters.status)query=query.eq("status",filters.status);query=cursor(query,filters,"due_date");result=await query;if(result.error)throw new Error("Unable to load payment schedules.");
    return finish("Loan payment schedules","Installment components and recorded paid amounts.",[{key:"due_date",label:"Due date",kind:"date"},{key:"employee",label:"Employee"},{key:"loan",label:"Loan"},{key:"installment_number",label:"Installment"},{key:"principal_due",label:"Principal",kind:"money"},{key:"interest_due",label:"Interest",kind:"money"},{key:"total_due",label:"Total due",kind:"money"},{key:"paid_amount",label:"Paid",kind:"money"},{key:"status",label:"Status"}],result.data,"due_date",r=>{const loan=(Array.isArray(r.loans)?r.loans[0]:r.loans)??{};return{id:r.id,due_date:r.due_date,employee:employeeLabel(loan.employee_profiles),loan:`${relationName(loan.loan_types)} ${loan.account_number??""}`,installment_number:r.installment_number,principal_due:String(r.principal_due),interest_due:String(r.interest_due),total_due:String(r.total_due),paid_amount:String(r.paid_amount??0),status:r.status}});
  }

  if(filters.report==="rebates"){
    query=db.from("rebates").select("id,rebate_date,amount,status,calculation_source,reference_number,employee_id,employee_profiles(employee_number,first_name,last_name),rebate_types(name)").is("deleted_at",null).order("rebate_date",{ascending:false}).order("id",{ascending:false}).limit(take);if(filters.employee)query=query.eq("employee_id",filters.employee);if(filters.start)query=query.gte("rebate_date",filters.start);if(filters.end)query=query.lte("rebate_date",filters.end);if(filters.status)query=query.eq("status",filters.status);query=cursor(query,filters,"rebate_date");result=await query;if(result.error)throw new Error("Unable to load rebates.");
    return finish("Rebate history","Manual and system-calculated rebate records.",[{key:"rebate_date",label:"Date",kind:"date"},{key:"employee",label:"Employee"},{key:"type",label:"Type"},{key:"reference_number",label:"Reference"},{key:"amount",label:"Amount",kind:"money"},{key:"calculation_source",label:"Source"},{key:"status",label:"Status"}],result.data,"rebate_date",r=>({id:r.id,rebate_date:r.rebate_date,employee:employeeLabel(r.employee_profiles),type:relationName(r.rebate_types),reference_number:r.reference_number,amount:String(r.amount),calculation_source:r.calculation_source,status:r.status}));
  }

  if(filters.report==="leave"){
    query=db.from("leave_entries").select("id,effective_date,entry_kind,quantity_delta,status,reference_number,employee_id,employee_profiles(employee_number,first_name,last_name),leave_types(name,unit)").is("deleted_at",null).order("effective_date",{ascending:false}).order("id",{ascending:false}).limit(take);if(filters.employee)query=query.eq("employee_id",filters.employee);if(filters.start)query=query.gte("effective_date",filters.start);if(filters.end)query=query.lte("effective_date",filters.end);if(filters.status)query=query.eq("status",filters.status);query=cursor(query,filters,"effective_date");result=await query;if(result.error)throw new Error("Unable to load leave history.");
    return finish("Leave balances and history","Posted leave ledger deltas; accrual formulas remain manual.",[{key:"effective_date",label:"Date",kind:"date"},{key:"employee",label:"Employee"},{key:"type",label:"Leave type"},{key:"entry_kind",label:"Entry"},{key:"quantity_delta",label:"Quantity"},{key:"unit",label:"Unit"},{key:"status",label:"Status"}],result.data,"effective_date",r=>{const lt=(Array.isArray(r.leave_types)?r.leave_types[0]:r.leave_types)??{};return{id:r.id,effective_date:r.effective_date,employee:employeeLabel(r.employee_profiles),type:lt.name??"Unknown",entry_kind:r.entry_kind,quantity_delta:String(r.quantity_delta),unit:lt.unit??"",status:r.status}});
  }

  if(filters.report==="employees"){
    query=db.from("employee_profiles").select("id,employee_number,first_name,middle_name,last_name,department,position_title,employment_category,employment_status,created_at").is("deleted_at",null).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(take);if(filters.department)query=query.eq("department",filters.department);if(filters.status)query=query.eq("employment_status",filters.status);if(filters.q)query=query.or(`employee_number.ilike.%${filters.q.replace(/[%(),.]/g,"")}%,last_name.ilike.%${filters.q.replace(/[%(),.]/g,"")}%`);query=cursor(query,filters,"created_at");result=await query;if(result.error)throw new Error("Unable to load employee master list.");
    return finish("Employee master list","Current non-archived employee master records.",[{key:"employee_number",label:"Employee no."},{key:"name",label:"Complete name"},{key:"department",label:"Department"},{key:"position_title",label:"Position"},{key:"employment_category",label:"Category"},{key:"employment_status",label:"Status"}],result.data,"created_at",r=>({id:r.id,created_at:r.created_at,employee_number:r.employee_number,name:[r.first_name,r.middle_name,r.last_name].filter(Boolean).join(" "),department:r.department,position_title:r.position_title,employment_category:r.employment_category,employment_status:r.employment_status}));
  }

  if(filters.report==="imports"){
    query=db.from("import_jobs").select("id,created_at,source_filename,import_type,status,total_rows,valid_rows,error_rows,completed_at").is("deleted_at",null).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(take);if(filters.start)query=query.gte("created_at",`${filters.start}T00:00:00Z`);if(filters.end)query=query.lte("created_at",`${filters.end}T23:59:59Z`);if(filters.status)query=query.eq("status",filters.status);query=cursor(query,filters,"created_at");result=await query;if(result.error)throw new Error("Unable to load import results.");
    return finish("Import results","Validated import jobs and row outcomes.",[{key:"created_at",label:"Started",kind:"datetime"},{key:"source_filename",label:"File"},{key:"import_type",label:"Type"},{key:"total_rows",label:"Rows"},{key:"valid_rows",label:"Valid"},{key:"error_rows",label:"Errors"},{key:"status",label:"Status"}],result.data,"created_at",r=>({id:r.id,created_at:r.created_at,source_filename:r.source_filename,import_type:r.import_type,total_rows:r.total_rows,valid_rows:r.valid_rows,error_rows:r.error_rows,status:r.status}));
  }

  query=db.from("audit_logs").select("id,occurred_at,actor_profile_id,subject_employee_id,action,entity_table,entity_id,old_data,new_data,reason,profiles!audit_logs_actor_profile_id_fkey(display_name),employee_profiles!audit_logs_subject_employee_id_fkey(employee_number,first_name,last_name)").order("occurred_at",{ascending:false}).order("id",{ascending:false}).limit(take);if(filters.employee)query=query.eq("subject_employee_id",filters.employee);if(filters.actor)query=query.eq("actor_profile_id",filters.actor);if(filters.module)query=query.eq("entity_table",filters.module);if(filters.start)query=query.gte("occurred_at",`${filters.start}T00:00:00Z`);if(filters.end)query=query.lte("occurred_at",`${filters.end}T23:59:59Z`);if(filters.status)query=query.eq("action",filters.status);query=cursor(query,filters,"occurred_at");result=await query;if(result.error)throw new Error("Unable to load audit activity.");
  return finish("Audit activity","Append-only record activity with safe field-level changes.",[{key:"occurred_at",label:"Date and time",kind:"datetime"},{key:"actor",label:"Actor"},{key:"employee",label:"Employee"},{key:"action",label:"Action"},{key:"module",label:"Module"},{key:"changes",label:"Safe changes"},{key:"reason",label:"Reason"}],result.data,"occurred_at",r=>({id:String(r.id),occurred_at:r.occurred_at,actor:relationName(r.profiles,"System"),employee:r.employee_profiles?employeeLabel(r.employee_profiles):"Not employee-specific",action:r.action,module:String(r.entity_table).replaceAll("_"," "),changes:auditDifferences(r.old_data,r.new_data).map(d=>`${d.field}: ${d.before} -> ${d.after}`).join("; ")||"No displayable field changes",reason:r.reason}));
}

export async function searchEmployees(term = "") {
  const db=createAdminClient();const safe=term.replace(/[%(),.]/g,"").trim();let query=db.from("employee_profiles").select("id,employee_number,first_name,last_name").is("deleted_at",null).order("last_name").limit(20);if(safe)query=query.or(`employee_number.ilike.%${safe}%,last_name.ilike.%${safe}%,first_name.ilike.%${safe}%`);const{data,error}=await query;if(error)throw new Error("Unable to search employees.");return data??[];
}

export async function listAdminActors(){const{data,error}=await createAdminClient().from("profiles").select("id,display_name").eq("role","admin").is("deleted_at",null).order("display_name");if(error)throw new Error("Unable to load audit actors.");return data??[];}
