import { createBrowserClient } from "@supabase/ssr";

// Used in client components ("use client"). Reads the public,
// row-level-security-protected anon key -- safe to expose in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
