import { notFound } from "next/navigation";

import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployeeForm, type EmployeeFormRecord } from "../../employee-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requireRole("admin");
  const { employeeId } = await params;
  const { data } = await createAdminClient().from("employee_profiles").select("id,employee_number,first_name,middle_name,last_name,suffix,department,position_title,employment_category,employment_status,email_address,mobile_number,address_text,notes").eq("id", employeeId).maybeSingle();
  if (!data) notFound();
  return <AdminFormLayout title="Edit employee" backHref={`/admin/employees/${employeeId}`}><EmployeeForm employee={data as EmployeeFormRecord} /></AdminFormLayout>;
}
