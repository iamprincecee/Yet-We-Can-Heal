"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { emotions } from "@/lib/emotions";
import ImageUploader from "@/components/admin/ImageUploader";

type Kind = "story" | "article";
type TypeFilter = "all" | "story" | "article";

type Item = {
  id: string;
  kind: Kind;
  title: string | null;
  slug?: string | null;
  excerpt?: string | null;
  body: string;
  what_helped_heal?: string | null;
  emotion_tags: string[];
  trigger_warning: string | null;
  image_url: string | null;
  is_anonymous?: boolean;
  author_name?: string | null;
  read_count?: number;
  helpful_count?: number;
};

export default function ContentHubPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublisher, setIsPublisher] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: p } = await supabase.from("admin_profiles").select("role").eq("id", user.id).single();
        setIsPublisher(p?.role === "super_admin" || p?.role === "chief_editor");
      }
    });
  }, []);

  // Fetch published content of the selected type(s), searched server-side.
  const load = useCallback(async () => {
    setLoading(true);
    const types: Kind[] = typeFilter === "all" ? ["story", "article"] : [typeFilter];
    const all: Item[] = [];
    for (const t of types) {
      const res = await fetch(`/api/admin/search?type=${t}&q=${encodeURIComponent(debounced)}`);
      if (res.ok) {
        const data = await res.json();
        for (const r of data.results as Item[]) all.push({ ...r, kind: t });
      }
    }
    setItems(all);
    setLoading(false);
  }, [typeFilter, debounced]);

  useEffect(() => { load(); }, [load]);

  async function del(item: Item) {
    if (!confirm(`Permanently delete "${item.title || "this piece"}"? This can't be undone.`)) return;
    const endpoint = item.kind === "story"
      ? `/api/admin/stories/${item.id}`
      : `/api/admin/articles/${item.id}`;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
    else setMsg((await res.json().catch(() => ({}))).error ?? "Couldn't delete.");
  }

  return (
    <section className="px-5 sm:px-6 md:px-16 py-12 md:py-16 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">Admin</p>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">← Dashboard</Link>
      </div>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mb-2">Stories &amp; Articles</h1>
      <p className="font-body text-ink/60 mb-6 text-sm sm:text-base">
        Search, edit, or remove any published piece.
      </p>

      {msg && <p className="font-body text-sm text-ember mb-4">{msg}</p>}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([["all", "All"], ["story", "Stories"], ["article", "Articles"]] as [TypeFilter, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setTypeFilter(v)}
            className={`font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-full border transition ${
              typeFilter === v ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/60 hover:border-ink/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search — full width on mobile */}
      <div className="relative mb-6 w-full sm:max-w-xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search published content…"
          className="w-full border border-ink/20 rounded-full pl-11 pr-4 py-3 font-body text-sm focus:border-ember outline-none"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
        </svg>
      </div>

      {loading ? (
        <p className="font-body text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="font-body text-ink/60">{debounced ? "No matches." : "Nothing published yet."}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="bg-white border border-ink/10 rounded-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      item.kind === "story" ? "bg-ember/15 text-ember" : "bg-skyburst/15 text-skyburst"
                    }`}>
                      {item.kind}
                    </span>
                    {item.trigger_warning && (
                      <span className="font-mono text-[10px] uppercase tracking-wide bg-plum/15 text-plum px-2 py-0.5 rounded-full">
                        ⚠ warning
                      </span>
                    )}
                  </div>
                  <p className="font-body font-medium break-words">{item.title || "Untitled"}</p>
                  <p className="font-mono text-xs text-ink/40 break-words">
                    {item.kind === "article" && item.slug ? `/${item.slug}` : ""}
                    {item.kind === "story" ? `${item.read_count ?? 0} reads · ${item.helpful_count ?? 0} helpful` : ""}
                  </p>
                </div>
                {isPublisher && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditing(editing === `${item.kind}-${item.id}` ? null : `${item.kind}-${item.id}`)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                    >
                      {editing === `${item.kind}-${item.id}` ? "Close" : "Edit"}
                    </button>
                    <button
                      onClick={() => del(item)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full text-ink/50 hover:border-ember hover:text-ember transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editing === `${item.kind}-${item.id}` && (
                <ContentEditor item={item} onSaved={() => { setEditing(null); load(); }} onError={setMsg} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Unified editor for a published story or article. Publisher-only (enforced by
// the API too). Edits content, emotion tags, sensitivity warning, and image.
function ContentEditor({
  item,
  onSaved,
  onError,
}: {
  item: Item;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [excerpt, setExcerpt] = useState(item.excerpt ?? "");
  const [body, setBody] = useState(item.body);
  const [whatHelped, setWhatHelped] = useState(item.what_helped_heal ?? "");
  const [tags, setTags] = useState<string[]>(item.emotion_tags ?? []);
  const [warning, setWarning] = useState(item.trigger_warning ?? "");
  const [image, setImage] = useState<string | null>(item.image_url ?? null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    let res: Response;
    if (item.kind === "story") {
      res = await fetch(`/api/admin/stories/${item.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          body,
          what_helped_heal: whatHelped,
          emotion_tags: tags,
          trigger_warning: warning.trim() || null,
          image_url: image,
        }),
      });
    } else {
      res = await fetch(`/api/admin/articles/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          body,
          emotionTags: tags,
          trigger_warning: warning.trim() || null,
          image_url: image,
        }),
      });
    }
    setSaving(false);
    if (res.ok) onSaved();
    else onError((await res.json().catch(() => ({}))).error ?? "Couldn't save.");
  }

  return (
    <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      {item.kind === "article" && (
        <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary"
          className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      {item.kind === "story" && (
        <textarea value={whatHelped} onChange={(e) => setWhatHelped(e.target.value)} rows={2} placeholder="What helped them heal"
          className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      )}
      <div className="flex flex-wrap gap-2">
        {Array.from(new Set([...emotions.map((e) => e.id), ...tags])).map((tag) => (
          <button type="button" key={tag}
            onClick={() => setTags((p) => p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag])}
            className={`font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full border ${
              tags.includes(tag) ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/40"
            }`}>
            {tag}
          </button>
        ))}
      </div>
      <input type="text" value={warning} onChange={(e) => setWarning(e.target.value)} placeholder="Sensitivity warning (optional)"
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      <ImageUploader value={image} onChange={setImage} />
      <button onClick={save} disabled={saving}
        className="font-body text-sm bg-ink text-white px-5 py-2 rounded-full hover:bg-ember transition disabled:opacity-50">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
