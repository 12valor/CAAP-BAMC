type SessionCookie = { name: string; value: string };

export function hasSupabaseSessionCookie(cookies: SessionCookie[]) {
  return cookies.some(
    ({ name, value }) =>
      /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/.test(name) &&
      value.length > 0 &&
      value !== "base64-null",
  );
}

export function sessionRedirectReason(cookies: SessionCookie[]) {
  return hasSupabaseSessionCookie(cookies)
    ? "session-expired"
    : "sign-in-required";
}
