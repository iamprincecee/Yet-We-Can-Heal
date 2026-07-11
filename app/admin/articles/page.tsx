"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emotions } from "@/lib/emotions";
import ImageUploader from "@/components/admin/ImageUploader";

type Article = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string;
  body: string;
  emotion_tags: string[];
  status: "pending" | "approved" | "rejected";
  is_anonymous: boolean;
  author_name: string | null;
  author_link: string | null;
  image_url: string | null;
  submitted_at: string;
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "published" | "write">("pending");

  // Per-article approval fields (slug + tags the admin will publish with).
  const [slugDraft, setSlugDraft] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState<Record<string, string[]>>({});
  const [imageDraft, setImageDraft] = useState<Record<string, string | null>>({});

  // Write-new form
  const [newDraft, setNewDraft] = useState({
    title: "", slug: "", excerpt: "", body: "", isAnonymous: true, authorName: "",
  });
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/articles");
    if (res.ok) {
      const data = await res.json();
      const list: Article[] = data.articles ?? [];
      setArticles(list);
      setPublishedCount(data.publishedCount ?? 0);
      const s: Record<string, string> = {};
      const t: Record<string, string[]> = {};
      for (const a of list) {
        s[a.id] = a.slug ?? a.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        t[a.id] = a.emotion_tags ?? [];
      }
      setSlugDraft(s);
      setTagDraft(t);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggleTag(id: string, tag: string) {
    setTagDraft((prev) => {
      const cur = prev[id] ?? [];
      return { ...prev, [id]: cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag] };
    });
  }

  async function approve(a: Article) {
    const res = await fetch(`/api/admin/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", slug: slugDraft[a.id], emotionTags: tagDraft[a.id], image_url: imageDraft[a.id] ?? a.image_url ?? null }),
    });
    if (res.ok) load();
    else setMsg((await res.json().catch(() => ({}))).error ?? "Approve failed.");
  }

  async function reject(a: Article) {
    const res = await fetch(`/api/admin/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (res.ok) load();
  }

  async function remove(a: Article) {
    if (!confirm("Delete this article permanently?")) return;
    const res = await fetch(`/api/admin/articles/${a.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function writeNew(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newDraft, emotionTags: newTags, image_url: newImage }),
    });
    if (res.ok) {
      setNewDraft({ title: "", slug: "", excerpt: "", body: "", isAnonymous: true, authorName: "" });
      setNewTags([]);
      setNewImage(null);
      setTab("published");
      load();
    } else {
      setMsg((await res.json().catch(() => ({}))).error ?? "Publish failed.");
    }
  }

  const pending = articles.filter((a) => a.status === "pending");
  const published = articles.filter((a) => a.status === "approved");

  return (
    <section className="px-6 md:px-16 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">Admin</p>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">← Dashboard</Link>
      </div>
      <h1 className="font-display text-3xl md:text-4xl mb-2">Articles</h1>
      <p className="font-body text-ink/60 mb-6">
        <span className="font-medium text-ink">{publishedCount}</span> article{publishedCount === 1 ? "" : "s"} published to date
        {pending.length > 0 && <> · <span className="text-ember">{pending.length} awaiting review</span></>}
      </p>

      <div className="flex gap-2 mb-8">
        {(["pending", "published", "write"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-full border transition-colors ${
              tab === t ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/60 hover:border-ink/50"
            }`}>
            {t === "write" ? "Write new" : t}
          </button>
        ))}
      </div>

      {msg && <p className="font-body text-sm text-ember mb-4">{msg}</p>}

      {/* WRITE NEW */}
      {tab === "write" && (
        <form onSubmit={writeNew} className="space-y-4 bg-white border border-ink/10 rounded-card p-6">
          <input type="text" required placeholder="Title" value={newDraft.title}
            onChange={(e) => setNewDraft((d) => ({ ...d, title: e.target.value }))}
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
          <input type="text" required placeholder="URL slug (e.g. finding-calm)" value={newDraft.slug}
            onChange={(e) => setNewDraft((d) => ({ ...d, slug: e.target.value }))}
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:border-ember outline-none" />
          <input type="text" placeholder="Short summary (optional)" value={newDraft.excerpt}
            onChange={(e) => setNewDraft((d) => ({ ...d, excerpt: e.target.value }))}
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
          <textarea required placeholder="Body" rows={10} value={newDraft.body}
            onChange={(e) => setNewDraft((d) => ({ ...d, body: e.target.value }))}
            className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
          <div className="flex flex-wrap gap-2">
            {emotions.map((em) => (
              <button type="button" key={em.id}
                onClick={() => setNewTags((p) => p.includes(em.id) ? p.filter((x) => x !== em.id) : [...p, em.id])}
                className={`font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-full border ${
                  newTags.includes(em.id) ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/50"
                }`}>
                {em.name}
              </button>
            ))}
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-2">
              Image (optional) — shown on the article and in share previews
            </p>
            <ImageUploader value={newImage} onChange={setNewImage} />
          </div>
          <button type="submit" className="font-body bg-ink text-white px-6 py-2.5 rounded-full hover:bg-ember transition">
            Publish article
          </button>
        </form>
      )}

      {/* PENDING QUEUE */}
      {tab === "pending" && (
        loading ? <p className="font-body text-ink/60">Loading...</p> :
        pending.length === 0 ? <p className="font-body text-ink/60">No articles awaiting review.</p> :
        <div className="space-y-6">
          {pending.map((a) => (
            <div key={a.id} className="bg-white border border-ember/30 rounded-card p-6">
              <h3 className="font-display text-xl mb-1">{a.title}</h3>
              <p className="font-mono text-xs text-ink/50 mb-3">
                {a.is_anonymous ? "Anonymous submission" : `By ${a.author_name}`}
              </p>
              <p className="font-body text-sm text-ink/80 whitespace-pre-line mb-4 max-h-48 overflow-y-auto border-l-2 border-ink/10 pl-4">
                {a.body}
              </p>

              <label className="block font-mono text-xs uppercase tracking-wide text-ink/40 mb-1">URL slug to publish</label>
              <input type="text" value={slugDraft[a.id] ?? ""}
                onChange={(e) => setSlugDraft((s) => ({ ...s, [a.id]: e.target.value }))}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm mb-3 focus:border-ember outline-none" />

              <div className="flex flex-wrap gap-2 mb-4">
                {emotions.map((em) => (
                  <button key={em.id} onClick={() => toggleTag(a.id, em.id)}
                    className={`font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full border ${
                      (tagDraft[a.id] ?? []).includes(em.id) ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/40"
                    }`}>
                    {em.name}
                  </button>
                ))}
              </div>

              <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-1">
                Image (optional) — shown on the article and in share previews
              </p>
              <div className="mb-4">
                <ImageUploader
                  value={imageDraft[a.id] ?? a.image_url ?? null}
                  onChange={(url) => setImageDraft((prev) => ({ ...prev, [a.id]: url }))}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => approve(a)}
                  className="font-body text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-ember transition">
                  Approve &amp; publish
                </button>
                <button onClick={() => reject(a)}
                  className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition">
                  Reject
                </button>
                <button onClick={() => remove(a)}
                  className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUBLISHED */}
      {tab === "published" && (
        loading ? <p className="font-body text-ink/60">Loading...</p> :
        published.length === 0 ? <p className="font-body text-ink/60">Nothing published yet.</p> :
        <div className="space-y-3">
          {published.map((a) => (
            <div key={a.id} className="bg-white border border-ink/10 rounded-card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-body font-medium truncate">{a.title}</p>
                <p className="font-mono text-xs text-ink/40">
                  /{a.slug} · {a.is_anonymous ? "anonymous" : a.author_name}
                </p>
              </div>
              <button onClick={() => remove(a)}
                className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
