import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sessionRedirectReason } from "@/lib/auth/session";
import type { Database } from "@/types/database";
import { getPublicEnvironment } from "@/validation/environment";

export async function updateSession(request: NextRequest) {
  const environment = getPublicEnvironment();
  const redirectReason = sessionRedirectReason(request.cookies.getAll());
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getClaims validates the token; getSession must not be trusted for server
  // authorization because cookie-backed session data can be spoofed.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const protectedPath =
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/") ||
    request.nextUrl.pathname === "/portal" ||
    request.nextUrl.pathname.startsWith("/portal/") ||
    request.nextUrl.pathname === "/employee" ||
    request.nextUrl.pathname.startsWith("/employee/") ||
    request.nextUrl.pathname === "/statement-of-account";

  if (protectedPath && (claimsError || !claimsData?.claims)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", redirectReason);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}
