"use client";

import { useState } from "react";
import { emotions } from "@/lib/emotions";
import PaintSplash from "@/components/PaintSplash";

export default function SubmitStoryPage() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [customEmotions, setCustomEmotions] = useState<string[]>([]);
  const [otherInputOpen, setOtherInputOpen] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");
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
    const value = otherDraft.trim();
    if (!value) return;
    // Case-insensitive de-dupe against both preset names and existing customs.
    const alreadyPreset = emotions.some(
      (e) => e.name.toLowerCase() === value.toLowerCase()
    );
    const alreadyCustom = customEmotions.some(
      (c) => c.toLowerCase() === value.toLowerCase()
    );
    if (!alreadyPreset && !alreadyCustom) {
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

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/stories/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title") || null,
        body: formData.get("body"),
        whatHelpedHeal: formData.get("helped"),
        emotionTags: selectedEmotions,
        otherEmotion: customEmotions.length > 0 ? customEmotions.join(", ") : null,
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
        <h1 className="font-display text-3xl mb-4">Your story is safe with us.</h1>
        <p className="font-body text-ink/70">
          It&apos;s been placed in our review queue. Our team will read it carefully before
          it&apos;s ever shared — and it stays completely anonymous, always.
        </p>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-16 py-16 max-w-2xl mx-auto relative">
      <PaintSplash color="plum" className="absolute -top-8 -left-10 w-28 h-28 opacity-40 -z-10" />

      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
        Completely anonymous
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-4">Share your story</h1>
      <p className="font-body text-ink/70 mb-10">
        This isn&apos;t about the pain alone — it&apos;s about what carried you through it.
        Every submission is reviewed by our team before anything is published, and nothing
        that could identify you is ever shared.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block font-body font-medium mb-2" htmlFor="title">
            Title <span className="text-ink/40 font-normal">(optional)</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            placeholder="Give your story a name, or leave this blank"
          />
        </div>

        <div>
          <label className="block font-body font-medium mb-2" htmlFor="body">
            Your story
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={8}
            className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            placeholder="Share what happened, and what it felt like to move through it..."
          />
        </div>

        <div>
          <label className="block font-body font-medium mb-2" htmlFor="helped">
            What helped you heal?
          </label>
          <textarea
            id="helped"
            name="helped"
            required
            rows={4}
            className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
            placeholder="A person, a practice, a realization — what carried you through?"
          />
        </div>

        <div>
          <p className="font-body font-medium mb-3">Which feelings does your story speak to?</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {emotions.map((emotion) => (
              <button
                type="button"
                key={emotion.id}
                onClick={() => toggleEmotion(emotion.id)}
                className={`font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
                  selectedEmotions.includes(emotion.id)
                    ? "bg-ink text-white border-ink"
                    : "border-ink/20 text-ink/60 hover:border-ink/50"
                }`}
              >
                {emotion.name}
              </button>
            ))}

            {/* Custom emotions the submitter has added, shown as removable chips */}
            {customEmotions.map((c) => (
              <span
                key={c}
                className="font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border bg-ember text-white border-ember inline-flex items-center gap-2"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCustomEmotion(c)}
                  aria-label={`Remove ${c}`}
                  className="hover:opacity-70"
                >
                  ✕
                </button>
              </span>
            ))}

            {/* "+ Other" chip -- toggles the inline input */}
            {!otherInputOpen && (
              <button
                type="button"
                onClick={() => setOtherInputOpen(true)}
                className="font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border border-dashed border-ink/30 text-ink/60 hover:border-ink/50"
              >
                + Other
              </button>
            )}
          </div>

          {/* Inline input, revealed when "+ Other" is clicked. Enter or "Add" commits. */}
          {otherInputOpen && (
            <div className="flex gap-2 mb-3">
              <input
                id="other-emotion"
                type="text"
                value={otherDraft}
                autoFocus
                onChange={(e) => setOtherDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomEmotion();
                  }
                  if (e.key === "Escape") {
                    setOtherDraft("");
                    setOtherInputOpen(false);
                  }
                }}
                placeholder="e.g. betrayed, relieved, exhausted..."
                className="flex-1 border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
              />
              <button
                type="button"
                onClick={addCustomEmotion}
                className="font-mono text-xs uppercase tracking-wide bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ember transition-colors"
              >
                Add
              </button>
            </div>
          )}

          <p className="font-body text-sm text-ink/70 mb-1">
            Don&apos;t see a feeling that fits? Tap <span className="font-medium">+ Other</span> to
            add your own — you can add as many as you need.
          </p>
          <p className="font-body text-xs text-ink/40">
            Our team reviews every tag before publishing and may adjust it if it doesn&apos;t
            quite fit the story.
          </p>
        </div>

        <label className="flex items-start gap-3 font-body text-sm text-ink/70">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          I understand this story will be published anonymously if approved, and I consent
          to minor edits for clarity or to protect my anonymity.
        </label>

        {error && <p className="font-body text-sm text-ember">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-body bg-ember text-white px-8 py-4 rounded-full font-medium hover:brightness-110 transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </section>
  );
}
