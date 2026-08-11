import type { Metadata } from "next";

import {
  AccountManagement,
  type EmployeeAccountRow,
} from "@/app/(admin)/admin/employees/account-management";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: employees, error: employeeError } = await admin
    .from("employee_profiles")
    .select(
      "id, employee_number, first_name, middle_name, last_name, suffix, position_title, profile_id",
    )
    .is("deleted_at", null)
    .order("last_name")
    .order("first_name");

  if (employeeError) {
    throw new Error("Unable to load employee account records.");
  }

  const profileIds = employees
    .map((employee) => employee.profile_id)
    .filter((profileId): profileId is string => Boolean(profileId));
  const [accountsResult, profilesResult] = await Promise.all([
    profileIds.length
      ? admin
          .from("account_usernames")
          .select("profile_id, username")
          .in("profile_id", profileIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? admin
          .from("profiles")
          .select("id, status")
          .in("id", profileIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (accountsResult.error || profilesResult.error) {
    throw new Error("Unable to load account status details.");
  }

  const usernames = new Map(
    accountsResult.data.map((account) => [account.profile_id, account.username]),
  );
  const statuses = new Map(
    profilesResult.data.map((profile) => [profile.id, profile.status]),
  );
  const rows: EmployeeAccountRow[] = employees.map((employee) => ({
    employeeId: employee.id,
    employeeNumber: employee.employee_number,
    name: [
      employee.first_name,
      employee.middle_name,
      employee.last_name,
      employee.suffix,
    ]
      .filter(Boolean)
      .join(" "),
    position: employee.position_title,
    profileId: employee.profile_id,
    username: employee.profile_id
      ? (usernames.get(employee.profile_id) ?? null)
      : null,
    status: employee.profile_id
      ? statuses.get(employee.profile_id) === "active"
        ? "active"
        : "disabled"
      : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrator workspace"
        preview={false}
        title="Employee account management"
        description="Issue username-based access, reset passwords, and enable or disable employee accounts. Employee record creation remains outside this phase."
      />
      <AccountManagement employees={rows} />
    </div>
  );
}
