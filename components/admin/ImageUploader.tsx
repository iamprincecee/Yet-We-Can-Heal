"use client";

import { useState, useRef } from "react";

// Small admin widget to attach/change/remove an image on a story or article.
// Uploads via the server route (admin-verified, service role) and returns the
// public URL, which the parent stores on approve/edit.
export default function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/content-image", { method: "POST", body: fd });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Upload failed.");
      setUploading(false);
      return;
    }
    const { url } = await res.json();
    onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border border-ink/10" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="font-mono text-xs uppercase tracking-wide text-ink/60 hover:text-ember"
          >
            {uploading ? "Uploading…" : "Change"}
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="font-mono text-xs uppercase tracking-wide text-ink/40 hover:text-ember"
          >
            Remove
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="font-mono text-xs uppercase tracking-wide border border-dashed border-ink/30 text-ink/60 px-3 py-2 rounded-lg hover:border-ink/50"
        >
          {uploading ? "Uploading…" : "+ Attach image"}
        </button>
      )}
      {error && <span className="font-body text-xs text-ember">{error}</span>}
    </div>
  );
}
