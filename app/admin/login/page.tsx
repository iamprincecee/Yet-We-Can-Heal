"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}

function AdminLoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("error") === "invalid_link") {
      setError("That invite or reset link was invalid or expired. Ask your Super Admin for a new one.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.session) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Confirm this account actually has an admin_profiles row -- a real
    // Supabase login isn't enough on its own; only people a Super Admin
    // has explicitly added can get into the dashboard.
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("id, role")
      .eq("id", data.session.user.id)
      .single();

    if (!profile) {
      setError("This account doesn't have dashboard access. Ask your Super Admin to add you.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    await supabase
      .from("admin_profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", profile.id);

    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2 text-center">
          Internal access
        </p>
        <h1 className="font-display text-2xl mb-8 text-center">Team sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            />
          </div>
          {error && <p className="font-body text-sm text-ember">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-body bg-ink text-white px-6 py-3 rounded-full font-medium hover:bg-ember transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="font-body text-xs text-ink/40 mt-6 text-center">
          This area is for Yet, We Can Heal team members only. If you need an account,
          ask your Super Admin to create one for you.
        </p>
      </div>
    </section>
  );
}
