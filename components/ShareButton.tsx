"use client";

import { useState } from "react";

// Share button: uses the device's native share sheet where available
// (mobile), and falls back to copy-to-clipboard on desktop. `path` is the
// page's own path; we build the absolute URL from the current origin so it
// works in any environment (localhost, preview, production).
export default function ShareButton({
  title,
  text,
  path,
}: {
  title: string;
  text?: string;
  path: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

    // Native share (mobile / supported browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // last-resort: do nothing graceful
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
