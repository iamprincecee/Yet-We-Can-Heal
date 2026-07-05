"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landing point for Supabase email links (invites, recovery). Runs in the
// browser so it can handle BOTH token styles:
//   1. PKCE flow:     ...?code=xxxx           (readable server- or client-side)
//   2. Implicit flow: ...#access_token=xxxx   (fragment -- ONLY readable in the
//      browser, which is why this is a client page and not a route handler).
// Either way, we establish the session, then forward to `next`
// (defaults to the set-password page for invited team members).
function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [message, setMessage] = useState("Verifying your invite...");

  useEffect(() => {
    async function handle() {
      const next = searchParams.get("next") ?? "/admin/set-password";
      const code = searchParams.get("code");

      // Case 1: PKCE -- exchange the code for a session.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          return;
        }
      }

      // Case 2: Implicit flow -- tokens are in the URL fragment (#...).
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1)); // drop the '#'
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            router.replace(next);
            return;
          }
        }
      }

      // Case 3: maybe the supabase client already picked up the session
      // automatically from the URL. Check before giving up.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
        return;
      }

      // Nothing worked -- the link was invalid or expired.
      setMessage("That link couldn't be verified. Redirecting...");
      router.replace("/admin/login?error=invalid_link");
    }

    handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6">
      <p className="font-body text-ink/60">{message}</p>
    </section>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
