"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PendingStory = {
  id: string;
  title: string | null;
  body: string;
  what_helped_heal: string;
  emotion_tags: string[];
  other_emotion: string | null;
};

type Metrics = {
  pageViews: number;
  storyReads: number;
  submissions: number;
  waitlistJoins: number;
  mostSelectedEmotions: { emotion: string; count: number }[];
  submissionEmotionBreakdown: { emotion: string; count: number }[];
};

export default function AdminDashboardPage() {
  const [queue, setQueue] = useState<PendingStory[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [role, setRole] = useState<"super_admin" | "editor" | null>(null);
  const [loading, setLoading] = useState(true);
  // Per-story working set of final tags the admin will publish with.
  const [finalTags, setFinalTags] = useState<Record<string, string[]>>({});
  // Inline story editing: which story is being edited, and the draft fields.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; body: string; what_helped_heal: string }>({
    title: "",
    body: "",
    what_helped_heal: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setRole((profile?.role as "super_admin" | "editor") ?? null);
      }

      const [pendingRes, metricsRes] = await Promise.all([
        fetch("/api/admin/stories/pending"),
        fetch("/api/admin/metrics"),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        const stories: PendingStory[] = data.stories ?? [];
        setQueue(stories);
        // Seed each story's editable tag set: its preset tags plus any custom
        // "other_emotion" values (comma-separated), normalized to lowercase so
        // they match how tags are stored and filtered.
        const seed: Record<string, string[]> = {};
        for (const s of stories) {
          const customs = (s.other_emotion ?? "")
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          seed[s.id] = Array.from(new Set([...s.emotion_tags, ...customs]));
        }
        setFinalTags(seed);
      }
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      setLoading(false);
    }
    load();

    // Live metrics: re-fetch just the metrics every 5 seconds so the dashboard
    // reflects new page views, reads, and submissions in near real time. We
    // deliberately don't re-poll the moderation queue here -- it shouldn't
    // reshuffle under an admin who's mid-review.
    const interval = setInterval(async () => {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) setMetrics(await res.json());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function toggleFinalTag(storyId: string, tag: string) {
    setFinalTags((prev) => {
      const current = prev[storyId] ?? [];
      return {
        ...prev,
        [storyId]: current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag],
      };
    });
  }

  async function approve(id: string) {
    const res = await fetch(`/api/admin/stories/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotionTags: finalTags[id] ?? [] }),
    });
    if (res.ok) setQueue((prev) => prev.filter((s) => s.id !== id));
  }

  async function reject(id: string) {
    const res = await fetch(`/api/admin/stories/${id}/reject`, { method: "PATCH" });
    if (res.ok) setQueue((prev) => prev.filter((s) => s.id !== id));
  }

  function startEdit(story: PendingStory) {
    setEditingId(story.id);
    setEditDraft({
      title: story.title ?? "",
      body: story.body,
      what_helped_heal: story.what_helped_heal,
    });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/stories/${id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editDraft.title || null,
        body: editDraft.body,
        what_helped_heal: editDraft.what_helped_heal,
      }),
    });
    if (res.ok) {
      setQueue((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, title: editDraft.title || null, body: editDraft.body, what_helped_heal: editDraft.what_helped_heal }
            : s
        )
      );
      setEditingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this submission? This can't be undone.")) return;
    const res = await fetch(`/api/admin/stories/${id}`, { method: "DELETE" });
    if (res.ok) setQueue((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <section className="px-6 md:px-16 py-12 max-w-5xl mx-auto">
        <p className="font-body text-ink/50">Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-16 py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-1">
            Signed in as {role === "super_admin" ? "Super Admin" : "Editor"}
          </p>
          <h1 className="font-display text-3xl">Moderation dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/messages"
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
          >
            Messages
          </Link>
          <Link
            href="/admin/activity-log"
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
          >
            Activity log
          </Link>
          {role === "super_admin" && (
            <Link
              href="/admin/team-profiles"
              className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
            >
              About-page team
            </Link>
          )}
          {role === "super_admin" && (
            <Link
              href="/admin/team"
              className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
            >
              Manage team
            </Link>
          )}
        </div>
      </div>

      {/* Metrics summary */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-tidewater animate-pulse" />
        <p className="font-mono text-xs uppercase tracking-wide text-ink/50">Live · updates every few seconds</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Page views" value={String(metrics?.pageViews ?? 0)} />
        <MetricCard label="Stories read" value={String(metrics?.storyReads ?? 0)} />
        <MetricCard label="Submissions" value={String(metrics?.submissions ?? 0)} />
        <MetricCard label="Waitlist joins" value={String(metrics?.waitlistJoins ?? 0)} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="font-display text-xl mb-4">Most-selected emotions (check-in)</h2>
          <div className="flex flex-wrap gap-2">
            {metrics?.mostSelectedEmotions.length ? (
              metrics.mostSelectedEmotions.map((e) => (
                <span key={e.emotion} className="font-mono text-xs uppercase tracking-wide bg-blush px-3 py-2 rounded-full">
                  {e.emotion} -- {e.count}
                </span>
              ))
            ) : (
              <p className="font-body text-sm text-ink/50">No check-in data yet.</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl mb-4">What people are submitting about</h2>
          <div className="flex flex-wrap gap-2">
            {metrics?.submissionEmotionBreakdown.length ? (
              metrics.submissionEmotionBreakdown.map((e) => (
                <span key={e.emotion} className="font-mono text-xs uppercase tracking-wide bg-marigold/20 px-3 py-2 rounded-full">
                  {e.emotion} -- {e.count}
                </span>
              ))
            ) : (
              <p className="font-body text-sm text-ink/50">No published stories yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending queue */}
      <h2 className="font-display text-xl mb-4">Pending stories ({queue.length})</h2>
      {queue.length === 0 ? (
        <p className="font-body text-ink/60">Queue is clear. Nothing waiting for review.</p>
      ) : (
        <div className="space-y-4">
          {queue.map((story) => (
            <div key={story.id} className="bg-white border border-ink/10 rounded-card shadow-card p-6">
              <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-2">
                Tags to publish — tap to include or exclude
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(() => {
                  // Options = this story's original preset tags + its custom
                  // emotions, so the admin can promote a "betrayed" into a real,
                  // filterable tag or leave it out.
                  const customs = (story.other_emotion ?? "")
                    .split(",")
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean);
                  const options = Array.from(new Set([...story.emotion_tags, ...customs]));
                  const chosen = finalTags[story.id] ?? [];
                  return options.map((tag) => {
                    const isCustom = customs.includes(tag) && !story.emotion_tags.includes(tag);
                    const active = chosen.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleFinalTag(story.id, tag)}
                        className={`font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full border transition-colors ${
                          active
                            ? "bg-ink text-white border-ink"
                            : "border-ink/20 text-ink/40 line-through hover:border-ink/50"
                        }`}
                        title={isCustom ? "Custom emotion from the submitter" : "Preset emotion"}
                      >
                        {isCustom ? `+ ${tag}` : tag}
                      </button>
                    );
                  });
                })()}
              </div>
              {editingId === story.id ? (
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Title (optional)"
                    className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                  />
                  <textarea
                    value={editDraft.body}
                    onChange={(e) => setEditDraft((d) => ({ ...d, body: e.target.value }))}
                    rows={6}
                    className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                  />
                  <textarea
                    value={editDraft.what_helped_heal}
                    onChange={(e) => setEditDraft((d) => ({ ...d, what_helped_heal: e.target.value }))}
                    rows={3}
                    placeholder="What helped them heal"
                    className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                  />
                </div>
              ) : (
                <>
                  {story.title && <p className="font-display text-lg mb-1">{story.title}</p>}
                  <p className="font-body text-sm text-ink/70 mb-4 whitespace-pre-line">{story.body}</p>
                  <div className="bg-marigold/10 border-l-4 border-marigold rounded-r-lg p-3 mb-4">
                    <p className="font-mono text-xs uppercase text-marigold mb-1">What helped them heal</p>
                    <p className="font-body text-sm text-ink/80">{story.what_helped_heal}</p>
                  </div>
                </>
              )}
              <div className="flex flex-wrap gap-3">
                {editingId === story.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(story.id)}
                      className="font-body text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-ember transition"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => approve(story.id)}
                      className="font-body text-sm bg-tidewater text-white px-4 py-2 rounded-full hover:brightness-110 transition"
                    >
                      Approve &amp; publish
                    </button>
                    <button
                      onClick={() => startEdit(story)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => reject(story.id)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => remove(story.id)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full text-ink/50 hover:border-ember hover:text-ember transition ml-auto"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-ink/10 rounded-card p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink/50 mb-1">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}
