import { notFound } from "next/navigation";

import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployeeAccountForm } from "../../../employee-account-form";

export default async function NewEmployeeAccountPage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requireRole("admin");
  const { employeeId } = await params;
  const { data } = await createAdminClient().from("employee_profiles").select("id,first_name,last_name,profile_id").eq("id", employeeId).maybeSingle();
  if (!data || data.profile_id) notFound();
  return <AdminFormLayout title="Create employee account" backHref={`/admin/employees/${employeeId}`} note={`${data.first_name} ${data.last_name}`}><EmployeeAccountForm employeeId={employeeId} /></AdminFormLayout>;
}
