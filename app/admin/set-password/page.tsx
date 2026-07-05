"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // The invited person should already have a session (created by the
  // /auth/callback exchange). If they don't, the link was invalid or expired.
  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(
          "This link is invalid or has expired. Ask your Super Admin to send a new invite."
        );
      } else {
        setEmail(user.email ?? null);
      }
      setChecking(false);
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Password set. Send them into the dashboard.
    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2 text-center">
          Welcome to the team
        </p>
        <h1 className="font-display text-2xl mb-8 text-center">Set your password</h1>

        {checking ? (
          <p className="font-body text-sm text-ink/60 text-center">Checking your invite...</p>
        ) : error && !email ? (
          <p className="font-body text-sm text-ember text-center">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {email && (
              <p className="font-body text-sm text-ink/60 text-center mb-2">
                Setting up access for <span className="font-medium text-ink">{email}</span>
              </p>
            )}
            <div>
              <label className="block font-body text-sm font-medium mb-1" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium mb-1" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
                placeholder="Type it again"
              />
            </div>
            {error && <p className="font-body text-sm text-ember">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-body bg-ink text-white px-6 py-3 rounded-full font-medium hover:bg-ember transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set password & continue"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
