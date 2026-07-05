"use client";

import { useState } from "react";
import PaintSplash from "@/components/PaintSplash";

export default function CommunityPage() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/community/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setJoined(true);
    setSubmitting(false);
  }

  return (
    <section className="px-6 md:px-16 py-24 max-w-xl mx-auto text-center relative min-h-[60vh] flex flex-col items-center justify-center">
      <PaintSplash color="skyburst" className="absolute -top-10 -left-10 w-32 h-32 opacity-40 -z-10" />
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
        Coming soon
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-4">
        A community, not just a comment section.
      </h1>
      <p className="font-body text-ink/70 mb-10">
        We&apos;re building a space for peer support and guided conversations with people
        who understand. It&apos;s not ready yet -- but you can be the first to know when it is.
      </p>

      {joined ? (
        <p className="font-body text-tidewater font-medium">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 border border-ink/20 rounded-full px-5 py-3 font-body focus:border-ember outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="font-body bg-ember text-white px-6 py-3 rounded-full font-medium hover:brightness-110 transition whitespace-nowrap disabled:opacity-50"
          >
            {submitting ? "Joining..." : "Join the waitlist"}
          </button>
        </form>
      )}
      {error && <p className="font-body text-sm text-ember mt-3">{error}</p>}
    </section>
  );
}
