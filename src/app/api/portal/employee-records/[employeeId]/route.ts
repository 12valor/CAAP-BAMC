import { NextResponse } from "next/server";

import { getCurrentPrincipal } from "@/lib/permissions/authorization";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (principal.role !== "employee") {
    return NextResponse.json({ error: "Employee access required." }, { status: 403 });
  }

  const { employeeId } = await params;
  if (!principal.employeeId || principal.employeeId !== employeeId) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: employee, error } = await supabase
    .from("employee_profiles")
    .select("id, employee_number, first_name, middle_name, last_name, suffix, department, position_title")
    .eq("id", employeeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !employee) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json({ employee });
}
