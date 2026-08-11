import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getPublicEnvironment } from "@/validation/environment";

export function createClient() {
  const environment = getPublicEnvironment();

  return createBrowserClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
