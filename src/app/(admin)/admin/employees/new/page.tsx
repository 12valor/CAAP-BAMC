import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { requireRole } from "@/lib/permissions/authorization";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  await requireRole("admin");
  return <AdminFormLayout title="Add employee" backHref="/admin/employees"><EmployeeForm /></AdminFormLayout>;
}
