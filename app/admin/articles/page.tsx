"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emotions } from "@/lib/emotions";
import ImageUploader from "@/components/admin/ImageUploader";

// Manual-send templates for article decisions (sent by hand from the official
// Gmail; no email service). The admin edits before sending.
function articlePublishMessage(title: string): string {
  return `Hi,

Thank you for your reflection. "${title}" has been reviewed and is now published on Yet, We Can Heal.

Your words may reach someone who needs them today.

With warmth,
The Yet, We Can Heal team`;
}

function articleRejectMessage(title: string): string {
  return `Hi,

Thank you for submitting "${title}" to Yet, We Can Heal. After careful review, we're not able to publish it in its current form.

This isn't a judgement of your work — it may simply need some adjustments to fit our guidelines. You're welcome to revise and submit again.

With care,
The Yet, We Can Heal team`;
}

type Article = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string;
  body: string;
  emotion_tags: string[];
  status: "pending" | "ready" | "approved" | "rejected";
  is_anonymous: boolean;
  author_name: string | null;
  author_link: string | null;
  image_url: string | null;
  trigger_warning: string | null;
  original_title: string | null;
  original_body: string | null;
  notify_email: string | null;
  submitted_at: string;
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"super_admin" | "chief_editor" | "editor" | null>(null);
  const [tab, setTab] = useState<"pending" | "write">("pending");

  // Per-article approval fields (slug + tags the admin will publish with).
  const [slugDraft, setSlugDraft] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState<Record<string, string[]>>({});
  const [imageDraft, setImageDraft] = useState<Record<string, string | null>>({});
  const [warnDraft, setWarnDraft] = useState<Record<string, string>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [decision, setDecision] = useState<
    { id: string; action: "publish" | "reject"; email: string | null; title: string } | null
  >(null);
  const [decisionMsg, setDecisionMsg] = useState("");
  const [decisionDone, setDecisionDone] = useState(false);

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
      const img: Record<string, string | null> = {};
      const w: Record<string, string> = {};
      for (const a of list) {
        s[a.id] = a.slug ?? a.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        t[a.id] = a.emotion_tags ?? [];
        img[a.id] = a.image_url ?? null;
        w[a.id] = a.trigger_warning ?? "";
      }
      setSlugDraft(s);
      setTagDraft(t);
      setImageDraft(img);
      setWarnDraft(w);
    }
    setLoading(false);
  }

  useEffect(() => { load(); loadRole(); }, []);

  async function loadRole() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("admin_profiles").select("role").eq("id", user.id).single();
      setRole((profile?.role as "super_admin" | "chief_editor" | "editor") ?? null);
    }
  }

  const isPublisher = role === "super_admin" || role === "chief_editor";

  function toggleTag(id: string, tag: string) {
    setTagDraft((prev) => {
      const cur = prev[id] ?? [];
      return { ...prev, [id]: cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag] };
    });
  }

  // Two-step: editors "ready", publishers "publish".
  async function moveArticle(a: Article, action: "ready" | "publish") {
    // Ready never notifies; publish with an email opens the compose modal.
    if (action === "publish" && a.notify_email) {
      setDecision({ id: a.id, action: "publish", email: a.notify_email, title: a.title });
      setDecisionMsg(articlePublishMessage(a.title));
      return;
    }
    await commitArticle(a, action);
  }

  async function commitArticle(a: Article, action: "ready" | "publish" | "reject") {
    const res = await fetch(`/api/admin/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        slug: slugDraft[a.id],
        emotionTags: tagDraft[a.id],
        image_url: imageDraft[a.id] ?? a.image_url ?? null,
        trigger_warning: (warnDraft[a.id] ?? "").trim() || null,
      }),
    });
    if (res.ok) {
      if (decision?.email) setDecisionDone(true);
      else load();
    } else {
      setMsg((await res.json().catch(() => ({}))).error ?? "Action failed.");
    }
  }

  async function reject(a: Article) {
    if (a.notify_email) {
      setDecision({ id: a.id, action: "reject", email: a.notify_email, title: a.title });
      setDecisionMsg(articleRejectMessage(a.title));
      return;
    }
    await commitArticle(a, "reject");
  }

  function closeDecision() {
    setDecision(null);
    setDecisionMsg("");
    setDecisionDone(false);
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
      setTab("pending");
      load();
    } else {
      setMsg((await res.json().catch(() => ({}))).error ?? "Publish failed.");
    }
  }

  const pending = articles.filter((a) => a.status === "pending" || a.status === "ready");

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

      <div className="flex gap-2 mb-3 flex-wrap">
        {(["pending", "write"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-full border transition-colors ${
              tab === t ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/60 hover:border-ink/50"
            }`}>
            {t === "write" ? "Write new" : "Pending review"}
          </button>
        ))}
      </div>
      <p className="font-body text-xs text-ink/40 mb-8">
        To edit or remove <em>published</em> articles, use{" "}
        <Link href="/admin/content" className="underline hover:text-ember">Stories &amp; Articles</Link>.
      </p>

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
              <div className="flex items-center gap-2 mb-1">
                {a.status === "ready" ? (
                  <span className="font-mono text-xs uppercase tracking-wide bg-tidewater/15 text-tidewater px-2 py-1 rounded-full">
                    Ready for final review
                  </span>
                ) : (
                  <span className="font-mono text-xs uppercase tracking-wide bg-ink/10 text-ink/60 px-2 py-1 rounded-full">
                    Pending first review
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl mb-1">{a.title}</h3>
              <p className="font-mono text-xs text-ink/50 mb-3">
                {a.is_anonymous ? "Anonymous submission" : `By ${a.author_name}`}
              </p>
              <p className="font-body text-sm text-ink/80 whitespace-pre-line mb-4 max-h-48 overflow-y-auto border-l-2 border-ink/10 pl-4">
                {a.body}
              </p>

              {a.original_body && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowOriginal((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                    className="font-mono text-xs uppercase tracking-wide text-skyburst hover:text-ember transition"
                  >
                    {showOriginal[a.id] ? "Hide original submission" : "⇄ Compare with original submission"}
                  </button>
                  {showOriginal[a.id] && (
                    <div className="mt-3 bg-skyburst/5 border-l-4 border-skyburst rounded-r-lg p-4 max-h-48 overflow-y-auto">
                      <p className="font-mono text-xs uppercase tracking-wide text-skyburst mb-2">
                        Original, as submitted (before edits)
                      </p>
                      {a.original_title && <p className="font-display text-base mb-1">{a.original_title}</p>}
                      <p className="font-body text-sm text-ink/70 whitespace-pre-line">{a.original_body}</p>
                    </div>
                  )}
                </div>
              )}

              <label className="block font-mono text-xs uppercase tracking-wide text-ink/40 mb-1">URL slug to publish</label>
              <input type="text" value={slugDraft[a.id] ?? ""}
                onChange={(e) => setSlugDraft((s) => ({ ...s, [a.id]: e.target.value }))}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm mb-3 focus:border-ember outline-none" />

              {/* Inline content edit in the review queue (title/excerpt/body).
                  Editing snapshots the original so Compare then shows changes. */}
              {isPublisher && (
                <div className="mb-3">
                  <button
                    onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                    className="font-mono text-xs uppercase tracking-wide text-skyburst hover:text-ember transition"
                  >
                    {editingId === a.id ? "Close editor" : "✎ Edit the article text"}
                  </button>
                  {editingId === a.id && (
                    <PublishedEditor article={a} onSaved={() => { setEditingId(null); load(); }} onError={setMsg} />
                  )}
                </div>
              )}

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

              <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-1">
                Sensitivity warning (optional) — readers see this before the article reveals
              </p>
              <input
                type="text"
                value={warnDraft[a.id] ?? ""}
                onChange={(e) => setWarnDraft((prev) => ({ ...prev, [a.id]: e.target.value }))}
                placeholder="e.g. Discusses grief and loss"
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm mb-4 focus:border-ember outline-none"
              />

              <div className="flex gap-2 flex-wrap items-center">
                {a.status === "pending" ? (
                  <button onClick={() => moveArticle(a, "ready")}
                    className="font-body text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-ember transition">
                    Mark ready for review
                  </button>
                ) : (
                  isPublisher ? (
                    <button onClick={() => moveArticle(a, "publish")}
                      className="font-body text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-ember transition">
                      Publish
                    </button>
                  ) : (
                    <span className="font-mono text-xs uppercase tracking-wide text-tidewater px-3 py-2">
                      ✓ Ready — awaiting Chief Editor
                    </span>
                  )
                )}
                {isPublisher && (
                  <>
                    <button onClick={() => reject(a)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition">
                      Reject
                    </button>
                    <button onClick={() => remove(a)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full text-ink/50 hover:border-ember hover:text-ember transition">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUBLISHED — publishers can edit even after publication. */}

      {decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
          onClick={closeDecision} role="dialog" aria-modal="true">
          <div className="bg-white rounded-card max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {!decisionDone ? (
              <>
                <h3 className="font-display text-xl mb-1">
                  {decision.action === "publish" ? "Publish this article" : "Reject this article"}
                </h3>
                <p className="font-body text-sm text-ink/60 mb-4">
                  This submitter asked to be notified. Confirm, then you&apos;ll get a ready-to-send message to email them.
                </p>
                <textarea value={decisionMsg} onChange={(e) => setDecisionMsg(e.target.value)} rows={9}
                  className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body text-sm mb-4 focus:border-ember outline-none" />
                <div className="flex gap-2 justify-end flex-wrap">
                  <button onClick={closeDecision}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const a = articles.find((x) => x.id === decision.id);
                      if (a) commitArticle(a, decision.action);
                    }}
                    className={`font-body text-sm px-5 py-2 rounded-full text-white transition ${
                      decision.action === "publish" ? "bg-tidewater hover:brightness-110" : "bg-ember hover:brightness-110"
                    }`}>
                    {decision.action === "publish" ? "Publish" : "Reject"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-xl mb-1">
                  {decision.action === "publish" ? "Published ✓" : "Rejected"}
                </h3>
                <p className="font-body text-sm text-ink/60 mb-4">
                  Now send this note from{" "}
                  <span className="font-mono text-ink">healingstories14@gmail.com</span>.
                </p>
                <div className="bg-ink/5 rounded-xl p-4 mb-3">
                  <p className="font-mono text-xs text-ink/50 mb-1">To</p>
                  <p className="font-body text-sm mb-3 select-all">{decision.email}</p>
                  <p className="font-mono text-xs text-ink/50 mb-1">Message</p>
                  <p className="font-body text-sm whitespace-pre-line select-all">{decisionMsg}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <a
                    href={`mailto:${decision.email}?subject=${encodeURIComponent(
                      decision.action === "publish"
                        ? "Your reflection is now live on Yet, We Can Heal"
                        : "An update on your reflection — Yet, We Can Heal"
                    )}&body=${encodeURIComponent(decisionMsg)}`}
                    className="font-body text-sm px-5 py-2 rounded-full bg-ink text-white hover:bg-ember transition"
                  >
                    Open in email
                  </a>
                  <button onClick={() => navigator.clipboard?.writeText(decisionMsg)}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition">
                    Copy message
                  </button>
                  <button onClick={() => { closeDecision(); load(); }}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Inline editor for already-published articles. Publishers only (the API
// enforces this too). Lets them fix content, adjust emotion tags to better
// match the piece, and set/clear the sensitivity warning.
function PublishedEditor({
  article,
  onSaved,
  onError,
}: {
  article: Article;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [body, setBody] = useState(article.body);
  const [tags, setTags] = useState<string[]>(article.emotion_tags ?? []);
  const [warning, setWarning] = useState(article.trigger_warning ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        excerpt,
        body,
        emotionTags: tags,
        trigger_warning: warning.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else onError((await res.json().catch(() => ({}))).error ?? "Couldn't save.");
  }

  return (
    <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Short summary"
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      <div className="flex flex-wrap gap-2">
        {emotions.map((em) => (
          <button type="button" key={em.id}
            onClick={() => setTags((p) => p.includes(em.id) ? p.filter((x) => x !== em.id) : [...p, em.id])}
            className={`font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full border ${
              tags.includes(em.id) ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/40"
            }`}>
            {em.name}
          </button>
        ))}
      </div>
      <input type="text" value={warning} onChange={(e) => setWarning(e.target.value)}
        placeholder="Sensitivity warning (optional)"
        className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none" />
      <button onClick={save} disabled={saving}
        className="font-body text-sm bg-ink text-white px-5 py-2 rounded-full hover:bg-ember transition disabled:opacity-50">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
