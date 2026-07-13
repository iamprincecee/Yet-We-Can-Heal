"use client";

import { useState } from "react";

// Shown after a reader marks something helpful: an optional, anonymous note
// about how it helped. The quiet counterpart to the Report button.
export default function FeedbackNote({
  contentType,
  contentId,
}: {
  contentType: "story" | "article";
  contentId: string;
}) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!note.trim()) return;
    setSending(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, note }),
    });
    setSending(false);
    if (res.ok) setSent(true);
  }

  if (sent) {
    return (
      <p className="font-body text-sm text-tidewater mt-3">
        Thank you — your words were passed on. They matter more than you know.
      </p>
    );
  }

  return (
    <div className="mt-3 bg-tidewater/5 border border-tidewater/20 rounded-card p-4">
      <p className="font-body text-sm text-ink/70 mb-2">
        Want to share how it helped? <span className="text-ink/40">(optional, anonymous)</span>
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="A line or two — it may encourage the person who wrote this…"
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm mb-2 focus:border-tidewater outline-none"
      />
      <button
        onClick={submit}
        disabled={sending || !note.trim()}
        className="font-body text-sm px-4 py-1.5 rounded-full bg-tidewater text-white hover:brightness-110 transition disabled:opacity-40"
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
