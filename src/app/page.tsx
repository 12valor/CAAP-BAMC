import { redirect } from "next/navigation";

import { roleHome } from "@/lib/auth/routing";
import { getCurrentPrincipal } from "@/lib/permissions/authorization";

export default async function HomePage() {
  const principal = await getCurrentPrincipal();
  if (principal) {
    redirect(roleHome(principal.role));
  }

  redirect("/login");
}
