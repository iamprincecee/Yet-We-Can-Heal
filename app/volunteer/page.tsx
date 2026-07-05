"use client";

import { useState } from "react";
import PaintSplash from "@/components/PaintSplash";

export default function VolunteerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/volunteer/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alias: formData.get("alias"),
        contact: formData.get("contact"),
        motivation: formData.get("motivation"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <section className="px-6 md:px-16 py-24 max-w-xl mx-auto text-center relative">
        <PaintSplash color="tidewater" className="absolute -top-10 -right-10 w-32 h-32 opacity-50 -z-10" />
        <h1 className="font-display text-3xl mb-4">Thank you for offering to help.</h1>
        <p className="font-body text-ink/70">
          Our team will review your application and reach out using the contact details
          you provided. There&apos;s no set timeline -- we take the time to get this right.
        </p>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-16 py-16 max-w-2xl mx-auto relative">
      <PaintSplash color="tidewater" className="absolute -top-8 -left-10 w-28 h-28 opacity-40 -z-10" />

      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
        Give back
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-4">Become a volunteer</h1>
      <p className="font-body text-ink/70 mb-10">
        If you&apos;ve healed and want to help others feel less alone, we&apos;d love to
        hear from you. Volunteers can contribute stories, encouragement, or peer support.
        This isn&apos;t a public listing -- your application goes directly to our team.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-body font-medium mb-2" htmlFor="alias">
            Name or alias
          </label>
          <input
            id="alias"
            name="alias"
            type="text"
            required
            className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            placeholder="Whatever you'd like us to call you"
          />
        </div>

        <div>
          <label className="block font-body font-medium mb-2" htmlFor="contact">
            How can we reach you?
          </label>
          <input
            id="contact"
            name="contact"
            type="text"
            required
            className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            placeholder="Email, phone, or WhatsApp"
          />
        </div>

        <div>
          <label className="block font-body font-medium mb-2" htmlFor="motivation">
            Why do you want to volunteer with us?
          </label>
          <textarea
            id="motivation"
            name="motivation"
            required
            rows={5}
            className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            placeholder="Share whatever feels relevant -- your own story, what draws you here, how you'd like to help..."
          />
        </div>

        {error && <p className="font-body text-sm text-ember">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-body bg-ember text-white px-8 py-4 rounded-full font-medium hover:brightness-110 transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </section>
  );
}
