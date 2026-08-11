"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createLoginRequestContext,
  recordLoginActivity,
} from "@/lib/auth/login-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const requestHeaders = await headers();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    try {
      const admin = createAdminClient();
      const { data: account } = await admin
        .from("account_usernames")
        .select("username")
        .eq("profile_id", user.id)
        .maybeSingle();
      username = account?.username ?? null;
    } catch {
      username = null;
    }
  }

  await supabase.auth.signOut({ scope: "global" });

  if (user && username) {
    try {
      const context = createLoginRequestContext(username, requestHeaders);
      await recordLoginActivity({
        context,
        outcome: "logout",
        profileId: user.id,
      });
    } catch {
      // Logout must still complete if the activity service is unavailable.
    }
  }

  redirect("/login");
}
