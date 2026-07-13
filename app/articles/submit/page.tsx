"use client";

import { useState } from "react";
import Link from "next/link";
import { emotions } from "@/lib/emotions";

export default function ArticleSubmitPage() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [customEmotions, setCustomEmotions] = useState<string[]>([]);
  const [otherInputOpen, setOtherInputOpen] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEmotion(id: string) {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  function addCustomEmotion() {
    const value = otherDraft.trim().toLowerCase();
    if (!value) return;
    const isPreset = emotions.some((e) => e.id === value || e.name.toLowerCase() === value);
    if (!isPreset && !customEmotions.includes(value)) {
      setCustomEmotions((prev) => [...prev, value]);
    }
    setOtherDraft("");
    setOtherInputOpen(false);
  }

  function removeCustomEmotion(value: string) {
    setCustomEmotions((prev) => prev.filter((c) => c !== value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/articles/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        excerpt: form.get("excerpt"),
        body: form.get("body"),
        emotionTags: [...selectedEmotions, ...customEmotions],
        isAnonymous,
        authorName: form.get("authorName"),
        notifyEmail: form.get("notifyEmail"),
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <section className="px-6 py-24 max-w-xl mx-auto text-center">
        <h1 className="font-display text-3xl mb-4">Thank you for writing.</h1>
        <p className="font-body text-ink/70 mb-8">
          Your piece is with our team for review. We read every submission with care —
          if it&apos;s published, it may help someone steady themselves on a hard day.
        </p>
        <Link href="/articles" className="font-body underline hover:text-ember">
          Back to articles
        </Link>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-16 py-16 max-w-2xl mx-auto">
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
        Contribute a reflection
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-4">Write something to lift a heart</h1>
      <p className="font-body text-ink/70 mb-8">
        You don&apos;t need a story of your own to help someone heal. If you have words that
        might steady a heart — a reflection, something you&apos;ve learned, a bit of comfort —
        you can write it here. Every piece is reviewed before it&apos;s published.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-body font-medium mb-1" htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body focus:border-ember outline-none" />
        </div>

        <div>
          <label className="block font-body font-medium mb-1" htmlFor="excerpt">
            Short summary <span className="text-ink/40 font-normal">(optional — one line)</span>
          </label>
          <input id="excerpt" name="excerpt" type="text"
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body focus:border-ember outline-none" />
        </div>

        <div>
          <label className="block font-body font-medium mb-1" htmlFor="body">Your writing</label>
          <textarea id="body" name="body" required rows={10}
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body focus:border-ember outline-none" />
        </div>

        <div>
          <p className="font-body font-medium mb-3">Which feelings does this speak to?</p>
          <div className="flex flex-wrap gap-2">
            {emotions.map((em) => (
              <button type="button" key={em.id} onClick={() => toggleEmotion(em.id)}
                className={`font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
                  selectedEmotions.includes(em.id)
                    ? "bg-ink text-white border-ink"
                    : "border-ink/20 text-ink/60 hover:border-ink/50"
                }`}>
                {em.name}
              </button>
            ))}
            {customEmotions.map((c) => (
              <span key={c}
                className="font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border bg-ember text-white border-ember inline-flex items-center gap-2">
                {c}
                <button type="button" onClick={() => removeCustomEmotion(c)} aria-label={`Remove ${c}`} className="hover:opacity-70">✕</button>
              </span>
            ))}
            {!otherInputOpen && (
              <button type="button" onClick={() => setOtherInputOpen(true)}
                className="font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border border-dashed border-ink/30 text-ink/60 hover:border-ink/50">
                + Other
              </button>
            )}
          </div>
          {otherInputOpen && (
            <div className="flex gap-2 mt-3">
              <input type="text" value={otherDraft} autoFocus
                onChange={(e) => setOtherDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addCustomEmotion(); }
                  if (e.key === "Escape") { setOtherDraft(""); setOtherInputOpen(false); }
                }}
                placeholder="e.g. betrayed, relieved..."
                className="flex-1 border border-ink/20 rounded-xl px-4 py-2 font-body text-sm focus:border-ember outline-none" />
              <button type="button" onClick={addCustomEmotion}
                className="font-mono text-xs uppercase tracking-wide bg-ink text-white px-4 py-2 rounded-xl hover:bg-ember transition">
                Add
              </button>
            </div>
          )}
          <p className="font-body text-xs text-ink/40 mt-2">
            Our team may adjust these tags to help the right readers find your piece.
          </p>
        </div>

        {/* Attribution choice */}
        <div className="bg-white border border-ink/10 rounded-card p-5">
          <p className="font-body font-medium mb-3">How would you like to be credited?</p>
          <div className="flex flex-col gap-2 mb-4">
            <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
              <input type="radio" name="anon" checked={isAnonymous} onChange={() => setIsAnonymous(true)} />
              Keep me anonymous
            </label>
            <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
              <input type="radio" name="anon" checked={!isAnonymous} onChange={() => setIsAnonymous(false)} />
              Credit me by name
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label className="block font-body text-sm mb-1" htmlFor="authorName">Your full name</label>
              <input id="authorName" name="authorName" type="text"
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
              <p className="font-body text-xs text-ink/40 mt-1">
                Your name will appear with your article. The piece itself is shareable.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block font-body text-sm mb-1" htmlFor="notifyEmail">
            Email <span className="text-ink/40">(optional — only to tell you when it&apos;s published)</span>
          </label>
          <input id="notifyEmail" name="notifyEmail" type="email" placeholder="you@example.com"
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
          <p className="font-body text-xs text-ink/40 mt-1">
            Never shown publicly, never shared — used once, for the good news.
          </p>
        </div>

        <label className="flex items-start gap-3 font-body text-sm text-ink/70">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          I understand this will be reviewed before publishing, and may be edited lightly for
          clarity. I&apos;m offering it freely to help others.
        </label>

        {error && <p className="font-body text-sm text-ember">{error}</p>}

        <button type="submit" disabled={submitting || !consent}
          className="font-body bg-ember text-white px-8 py-3.5 rounded-full font-medium hover:brightness-110 transition disabled:opacity-40">
          {submitting ? "Sending..." : "Submit for review"}
        </button>
      </form>
    </section>
  );
}
