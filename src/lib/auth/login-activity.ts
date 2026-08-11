import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createRequestFingerprint, normalizeUsername } from "@/lib/auth/security";
import { getServerEnvironment } from "@/validation/environment";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const USERNAME_ATTEMPT_LIMIT = 5;
const NETWORK_ATTEMPT_LIMIT = 20;
const RATE_LIMIT_OUTCOMES = [
  "invalid_credentials",
  "disabled",
  "rate_limited",
] as const;

export type LoginActivityOutcome =
  | "success"
  | "invalid_credentials"
  | "disabled"
  | "rate_limited"
  | "session_expired"
  | "logout";

export type LoginRequestContext = {
  networkFingerprint: string;
  normalizedUsername: string;
  userAgent: string | null;
  usernameFingerprint: string;
};

function getNetworkAddress(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0];
  return (
    forwardedFor?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown-network"
  );
}

export function createLoginRequestContext(
  username: string,
  requestHeaders: Headers,
): LoginRequestContext {
  const environment = getServerEnvironment();
  const normalizedUsername = normalizeUsername(username);
  const networkAddress = getNetworkAddress(requestHeaders);

  return {
    normalizedUsername,
    usernameFingerprint: createRequestFingerprint(
      `username:${normalizedUsername}`,
      environment.AUTH_RATE_LIMIT_SECRET,
    ),
    networkFingerprint: createRequestFingerprint(
      `network:${networkAddress}`,
      environment.AUTH_RATE_LIMIT_SECRET,
    ),
    userAgent: requestHeaders.get("user-agent")?.slice(0, 512) ?? null,
  };
}

export async function isLoginRateLimited(context: LoginRequestContext) {
  const admin = createAdminClient();
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000,
  ).toISOString();

  const [usernameAttempts, networkAttempts] = await Promise.all([
    admin
      .from("login_activity")
      .select("id", { count: "exact", head: true })
      .eq("username_fingerprint", context.usernameFingerprint)
      .in("outcome", [...RATE_LIMIT_OUTCOMES])
      .gte("occurred_at", windowStart),
    admin
      .from("login_activity")
      .select("id", { count: "exact", head: true })
      .eq("network_fingerprint", context.networkFingerprint)
      .in("outcome", [...RATE_LIMIT_OUTCOMES])
      .gte("occurred_at", windowStart),
  ]);

  if (usernameAttempts.error || networkAttempts.error) {
    throw new Error("Login protection is temporarily unavailable.");
  }

  return (
    (usernameAttempts.count ?? 0) >= USERNAME_ATTEMPT_LIMIT ||
    (networkAttempts.count ?? 0) >= NETWORK_ATTEMPT_LIMIT
  );
}

export async function recordLoginActivity({
  context,
  outcome,
  profileId,
}: {
  context: LoginRequestContext;
  outcome: LoginActivityOutcome;
  profileId?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("login_activity").insert({
    profile_id: profileId ?? null,
    username_fingerprint: context.usernameFingerprint,
    network_fingerprint: context.networkFingerprint,
    outcome,
    user_agent: context.userAgent,
  });

  if (error) {
    throw new Error("Unable to record login activity.");
  }
}
