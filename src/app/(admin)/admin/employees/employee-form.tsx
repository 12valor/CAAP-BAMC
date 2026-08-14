"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { saveEmployeeAction } from "./actions";
import { AdminFormActions } from "@/components/admin/admin-form-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type EmployeeFormRecord = {
  id: string;
  employee_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  department: string | null;
  position_title: string | null;
  employment_category: string;
  employment_status: string;
  email_address: string | null;
  mobile_number: string | null;
  address_text: string | null;
  notes: string | null;
};

export function EmployeeForm({ employee }: { employee?: EmployeeFormRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const cancelHref = employee ? `/admin/employees/${employee.id}` : "/admin/employees";

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      startTransition(async () => {
        const result = await saveEmployeeAction(new FormData(event.currentTarget));
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(result.success);
        router.push(result.id ? `/admin/employees/${result.id}` : cancelHref);
        router.refresh();
      });
    }}>
      <input type="hidden" name="employeeId" value={employee?.id ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Employee number" name="employeeNumber" required value={employee?.employee_number} />
        <Field label="First name" name="firstName" required value={employee?.first_name} />
        <Field label="Middle name" name="middleName" value={employee?.middle_name} />
        <Field label="Last name" name="lastName" required value={employee?.last_name} />
        <Field label="Suffix" name="suffix" value={employee?.suffix} />
        <Field label="Department" name="department" value={employee?.department} />
        <Field label="Position" name="positionTitle" value={employee?.position_title} />
        <Field label="Employment category" name="employmentCategory" required value={employee?.employment_category ?? "Permanent"} />
        <div className="space-y-2"><Label htmlFor="employmentStatus">Employment status</Label><Select name="employmentStatus" defaultValue={employee?.employment_status ?? "active"}><SelectTrigger id="employmentStatus" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["active", "inactive", "separated", "retired"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <Field label="Email" name="emailAddress" type="email" value={employee?.email_address} />
        <Field label="Mobile number" name="mobileNumber" value={employee?.mobile_number} />
        <Field label="Address" name="addressText" value={employee?.address_text} wide />
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" rows={3} defaultValue={employee?.notes ?? ""} /></div>
      </div>
      <AdminFormActions cancelHref={cancelHref} pending={pending} submitLabel={employee ? "Save changes" : "Add employee"} />
    </form>
  );
}

function Field({ label, name, value, required, type, wide }: { label: string; name: string; value?: string | null; required?: boolean; type?: string; wide?: boolean }) {
  return <div className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required={required} defaultValue={value ?? ""} /></div>;
}
