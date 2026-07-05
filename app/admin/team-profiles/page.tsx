"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
};

type Draft = {
  name: string;
  role: string;
  bio: string;
  photo_url: string | null;
  sort_order: number;
};

const emptyDraft: Draft = { name: "", role: "", bio: "", photo_url: null, sort_order: 0 };

export default function TeamProfilesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/team-profiles");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNew() {
    setDraft({ ...emptyDraft, sort_order: members.length });
    setEditingId("new");
    setError(null);
  }

  function startEdit(m: Member) {
    setDraft({
      name: m.name,
      role: m.role,
      bio: m.bio ?? "",
      photo_url: m.photo_url,
      sort_order: m.sort_order,
    });
    setEditingId(m.id);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    // Upload via our server route, which verifies Super Admin status and uses
    // the service-role key. This avoids browser-session RLS issues at the
    // storage layer that can otherwise block legitimate uploads.
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/team-profiles/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(`Photo upload failed: ${d.error ?? "unknown error"}`);
      setUploading(false);
      return;
    }

    const { url } = await res.json();
    setDraft((d) => ({ ...d, photo_url: url }));
    setUploading(false);
    // Reset the input so selecting the same file again still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function save() {
    if (!draft.name.trim() || !draft.role.trim()) {
      setError("Name and role are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const isNew = editingId === "new";
    const url = isNew ? "/api/admin/team-profiles" : `/api/admin/team-profiles/${editingId}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed.");
      setSaving(false);
      return;
    }

    setSaving(false);
    cancel();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this team member from the About page?")) return;
    const res = await fetch(`/api/admin/team-profiles/${id}`, { method: "DELETE" });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <section className="px-6 md:px-16 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">Super Admin</p>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
          ← Dashboard
        </Link>
      </div>
      <h1 className="font-display text-3xl md:text-4xl mb-2">Team on the About page</h1>
      <p className="font-body text-ink/70 mb-8 max-w-2xl">
        Add and edit the people shown publicly on the About page. This is separate from
        dashboard logins — adding someone here doesn&apos;t give them admin access.
      </p>

      {editingId === null && (
        <button
          onClick={startNew}
          className="font-body bg-ink text-white px-6 py-3 rounded-full font-medium hover:bg-ember transition mb-8"
        >
          + Add team member
        </button>
      )}

      {editingId !== null && (
        <div className="bg-white border border-ink/10 rounded-card p-6 mb-8">
          <h2 className="font-display text-xl mb-4">
            {editingId === "new" ? "New team member" : "Edit team member"}
          </h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="text-center">
              {/* Hidden real input, triggered via ref from the button/avatar below */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 mx-auto mb-2 block rounded-full overflow-hidden group relative disabled:opacity-60"
                title="Click to upload a photo"
              >
                {draft.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.photo_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blush flex items-center justify-center font-display text-2xl text-ink/40">
                    ?
                  </div>
                )}
                <span className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition">
                  Change
                </span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="font-mono text-xs uppercase tracking-wide text-ink/60 hover:text-ember disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload photo"}
              </button>
            </div>

            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Name"
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
              />
              <input
                type="text"
                value={draft.role}
                onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                placeholder="Role (e.g. Founder, Moderator)"
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
              />
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="Short bio"
                rows={3}
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
              />
              <label className="block font-body text-xs text-ink/50">
                Display order
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))}
                  className="ml-2 w-20 border border-ink/20 rounded-lg px-2 py-1 font-body text-sm focus:border-ember outline-none"
                />
              </label>
            </div>
          </div>

          {error && <p className="font-body text-sm text-ember mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={save}
              disabled={saving || uploading}
              className="font-body bg-ink text-white px-6 py-2.5 rounded-full font-medium hover:bg-ember transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancel}
              className="font-body border border-ink/20 px-6 py-2.5 rounded-full hover:border-ink/50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-body text-ink/60">Loading...</p>
      ) : members.length === 0 ? (
        <p className="font-body text-ink/60">No team members yet. Add the first one above.</p>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="bg-white border border-ink/10 rounded-card p-4 flex items-center gap-4">
              {m.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photo_url} alt={m.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blush flex items-center justify-center font-display text-ink/40 shrink-0">
                  {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium truncate">{m.name}</p>
                <p className="font-mono text-xs uppercase tracking-wide text-ink/50">{m.role}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(m)}
                  className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
