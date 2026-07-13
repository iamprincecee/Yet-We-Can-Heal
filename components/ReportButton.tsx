"use client";

import { useState, useEffect } from "react";

// A small "Report" control readers can use to flag a story or article. Opens a
// modal with a reason + optional note. No login required.
const REASONS = [
  "Harmful or dangerous content",
  "Identifies a real person / privacy concern",
  "Hateful or abusive",
  "Spam or off-topic",
  "Something else",
];

export default function ReportButton({
  contentType,
  contentId,
}: {
  contentType: "story" | "article";
  contentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape and lock scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function submit() {
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setSending(true);
    setError(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, reason, note }),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Couldn't submit the report.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-xs uppercase tracking-wide text-ink/40 hover:text-ember transition"
      >
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Report this content"
        >
          <div
            className="bg-white rounded-card max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="text-center py-4">
                <h3 className="font-display text-xl mb-2">Thank you</h3>
                <p className="font-body text-sm text-ink/70 mb-6">
                  Your report has been sent to our team. We take every one seriously.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="font-body text-sm px-5 py-2 rounded-full bg-ink text-white hover:bg-ember transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl mb-1">Report this</h3>
                <p className="font-body text-sm text-ink/60 mb-4">
                  Let us know what&apos;s wrong. Our team reviews every report.
                </p>

                <label className="block font-body text-sm font-medium mb-1" htmlFor="report-reason">
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm mb-4 focus:border-ember outline-none"
                >
                  <option value="">Choose a reason…</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <label className="block font-body text-sm font-medium mb-1" htmlFor="report-note">
                  Anything else? <span className="text-ink/40 font-normal">(optional)</span>
                </label>
                <textarea
                  id="report-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm mb-4 focus:border-ember outline-none"
                />

                {error && <p className="font-body text-sm text-ember mb-3">{error}</p>}

                <div className="flex gap-2 justify-end flex-wrap">
                  <button
                    onClick={() => setOpen(false)}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={sending}
                    className="font-body text-sm px-5 py-2 rounded-full bg-ember text-white hover:brightness-110 transition disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Submit report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
