"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "@/components/admin/ImageUploader";

// Starter templates the admin can edit before sending. Warm, human defaults.
function defaultPublishMessage(title: string | null): string {
  return `Hi,

Thank you for trusting us with your words. ${title ? `"${title}"` : "Your story"} has been reviewed and is now published on Yet, We Can Heal.

Someone out there may read it today and feel less alone because of you.

With warmth,
The Yet, We Can Heal team`;
}

function defaultRejectMessage(title: string | null): string {
  return `Hi,

Thank you for sharing ${title ? `"${title}"` : "your story"} with us. After careful review, we're not able to publish it in its current form.

Please know this is never a judgement of your experience — it may simply need some adjustments to fit our guidelines. You're welcome to revise and submit again.

With care,
The Yet, We Can Heal team`;
}

type PendingStory = {
  id: string;
  title: string | null;
  body: string;
  what_helped_heal: string;
  emotion_tags: string[];
  other_emotion: string | null;
  status: "pending" | "ready";
  trigger_warning: string | null;
  image_url: string | null;
  original_title: string | null;
  original_body: string | null;
  original_what_helped: string | null;
  notify_email: string | null;
};

type Metrics = {
  uniqueVisitors: number;
  avgTimeOnSiteSeconds: number;
  storyReads: number;
  submissions: number;
  waitlistJoins: number;
  mostSelectedEmotions: { emotion: string; count: number }[];
  submissionEmotionBreakdown: { emotion: string; count: number }[];
};

// Format seconds as m:ss (e.g. 95 -> "1:35"). Shows "0s" when empty.
function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function AdminDashboardPage() {
  const [queue, setQueue] = useState<PendingStory[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [role, setRole] = useState<"super_admin" | "chief_editor" | "editor" | null>(null);
  const [loading, setLoading] = useState(true);
  // Per-story working set of final tags the admin will publish with.
  const [finalTags, setFinalTags] = useState<Record<string, string[]>>({});
  const [storyImages, setStoryImages] = useState<Record<string, string | null>>({});
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
        setRole((profile?.role as "super_admin" | "chief_editor" | "editor") ?? null);
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
        const imgSeed: Record<string, string | null> = {};
        const warnSeed: Record<string, string> = {};
        for (const s of stories) {
          const customs = (s.other_emotion ?? "")
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          seed[s.id] = Array.from(new Set([...s.emotion_tags, ...customs]));
          // CRITICAL: carry the image + warning an earlier reviewer attached,
          // so the publisher's "Publish" doesn't wipe them with empty state.
          imgSeed[s.id] = s.image_url ?? null;
          warnSeed[s.id] = s.trigger_warning ?? "";
        }
        setFinalTags(seed);
        setStoryImages(imgSeed);
        setWarningDraft(warnSeed);
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

  const [warningDraft, setWarningDraft] = useState<Record<string, string>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

  const isPublisher = role === "super_admin" || role === "chief_editor";

  // Two-step: editors "ready" a story; publishers "publish" it.
  // For publish/reject on a story whose submitter left an email, we first open
  // a compose modal so the admin can write a custom message that gets emailed.
  const [decision, setDecision] = useState<
    { id: string; action: "publish" | "reject"; email: string | null; title: string | null } | null
  >(null);
  const [decisionMsg, setDecisionMsg] = useState("");
  const [decisionSending, setDecisionSending] = useState(false);
  const [decisionDone, setDecisionDone] = useState(false);

  function closeDecision() {
    setDecision(null);
    setDecisionMsg("");
    setDecisionDone(false);
  }

  async function moveStory(id: string, action: "ready" | "publish") {
    // Ready never emails — just move it.
    if (action === "ready") {
      const res = await fetch(`/api/admin/stories/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          emotionTags: finalTags[id] ?? [],
          imageUrl: storyImages[id] ?? null,
          triggerWarning: (warningDraft[id] ?? "").trim() || null,
        }),
      });
      if (res.ok) setQueue((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    // Publish: if submitter opted in for email, open the compose modal first.
    const story = queue.find((s) => s.id === id);
    if (story?.notify_email) {
      setDecision({ id, action: "publish", email: story.notify_email, title: story.title });
      setDecisionMsg(defaultPublishMessage(story.title));
      return;
    }
    // No email on file — publish directly.
    await commitDecision(id, "publish", "");
  }

  async function reject(id: string) {
    const story = queue.find((s) => s.id === id);
    if (story?.notify_email) {
      setDecision({ id, action: "reject", email: story.notify_email, title: story.title });
      setDecisionMsg(defaultRejectMessage(story.title));
      return;
    }
    await commitDecision(id, "reject", "");
  }

  // After committing publish/reject, if there's an email we surface a manual
  // send panel (template + recipient + mailto + copy). Sent from the official
  // Gmail by hand — no email service involved.
  async function commitDecision(id: string, action: "publish" | "reject", message: string) {
    setDecisionSending(true);
    const res = await fetch(`/api/admin/stories/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        emotionTags: finalTags[id] ?? [],
        imageUrl: storyImages[id] ?? null,
        triggerWarning: (warningDraft[id] ?? "").trim() || null,
      }),
    });
    setDecisionSending(false);
    if (res.ok) {
      setQueue((prev) => prev.filter((s) => s.id !== id));
      if (decision?.email) {
        // Keep the modal open in "send this manually" mode.
        setDecisionDone(true);
      } else {
        setDecision(null);
        setDecisionMsg("");
      }
    }
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
            Signed in as {role === "super_admin" ? "Super Admin" : role === "chief_editor" ? "Chief Editor" : "Editor"}
          </p>
          <h1 className="font-display text-2xl md:text-3xl">Moderation dashboard</h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/admin/reports"
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
          >
            Reports
          </Link>
          <Link
            href="/admin/content"
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
          >
            Stories &amp; Articles
          </Link>
          <Link
            href="/admin/articles"
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
          >
            Article Queue
          </Link>
          <Link
            href="/admin/messages"
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
          >
            Messages
          </Link>
          {isPublisher && (
            <Link
              href="/admin/activity-log"
              className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember"
            >
              Activity log
            </Link>
          )}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <MetricCard label="Unique visits" value={String(metrics?.uniqueVisitors ?? 0)} />
        <MetricCard label="Avg time on site" value={formatDuration(metrics?.avgTimeOnSiteSeconds ?? 0)} />
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
      <h2 className="font-display text-xl mb-4">Stories in review ({queue.length})</h2>
      {queue.length === 0 ? (
        <p className="font-body text-ink/60">Queue is clear. Nothing waiting for review.</p>
      ) : (
        <div className="space-y-4">
          {queue.map((story) => (
            <div key={story.id} className="bg-white border border-ink/10 rounded-card shadow-card p-6">
              <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-2">
                Emotion image (optional) — shown on the story and in share previews
              </p>
              <div className="mb-4">
                <ImageUploader
                  value={storyImages[story.id] ?? null}
                  onChange={(url) => setStoryImages((prev) => ({ ...prev, [story.id]: url }))}
                />
              </div>
              <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-2">
                Sensitivity warning (optional) — readers see this before the story reveals
              </p>
              <input
                type="text"
                value={warningDraft[story.id] ?? ""}
                onChange={(e) => setWarningDraft((prev) => ({ ...prev, [story.id]: e.target.value }))}
                placeholder="e.g. Mentions self-harm"
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm mb-4 focus:border-ember outline-none"
              />
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
                  <div className="flex items-center gap-2 mb-2">
                    {story.status === "ready" ? (
                      <span className="font-mono text-xs uppercase tracking-wide bg-tidewater/15 text-tidewater px-2 py-1 rounded-full">
                        Ready for final review
                      </span>
                    ) : (
                      <span className="font-mono text-xs uppercase tracking-wide bg-ink/10 text-ink/60 px-2 py-1 rounded-full">
                        Pending first review
                      </span>
                    )}
                    {story.trigger_warning && (
                      <span className="font-mono text-xs uppercase tracking-wide bg-ember/15 text-ember px-2 py-1 rounded-full">
                        ⚠ Has warning
                      </span>
                    )}
                  </div>
                  {story.title && <p className="font-display text-lg mb-1">{story.title}</p>}
                  <p className="font-body text-sm text-ink/70 mb-4 whitespace-pre-line">{story.body}</p>

                  {/* Review transparency: if this submission was edited, the
                      publisher can see the untouched original side by side. */}
                  {story.original_body && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowOriginal((prev) => ({ ...prev, [story.id]: !prev[story.id] }))}
                        className="font-mono text-xs uppercase tracking-wide text-skyburst hover:text-ember transition"
                      >
                        {showOriginal[story.id] ? "Hide original submission" : "⇄ Compare with original submission"}
                      </button>
                      {showOriginal[story.id] && (
                        <div className="mt-3 bg-skyburst/5 border-l-4 border-skyburst rounded-r-lg p-4">
                          <p className="font-mono text-xs uppercase tracking-wide text-skyburst mb-2">
                            Original, as submitted (before edits)
                          </p>
                          {story.original_title && (
                            <p className="font-display text-base mb-1">{story.original_title}</p>
                          )}
                          <p className="font-body text-sm text-ink/70 whitespace-pre-line mb-2">
                            {story.original_body}
                          </p>
                          {story.original_what_helped && (
                            <p className="font-body text-xs text-ink/60">
                              <strong>What helped:</strong> {story.original_what_helped}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                    {story.status === "pending" ? (
                      <button
                        onClick={() => moveStory(story.id, "ready")}
                        className="font-body text-sm bg-tidewater text-white px-4 py-2 rounded-full hover:brightness-110 transition"
                      >
                        Mark ready for review
                      </button>
                    ) : (
                      // status === "ready"
                      isPublisher ? (
                        <button
                          onClick={() => moveStory(story.id, "publish")}
                          className="font-body text-sm bg-tidewater text-white px-4 py-2 rounded-full hover:brightness-110 transition"
                        >
                          Publish
                        </button>
                      ) : (
                        <span className="font-mono text-xs uppercase tracking-wide text-tidewater px-4 py-2">
                          ✓ Ready — awaiting Chief Editor
                        </span>
                      )
                    )}
                    <button
                      onClick={() => startEdit(story)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                    >
                      Edit
                    </button>
                    {isPublisher && (
                      <>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
          onClick={closeDecision} role="dialog" aria-modal="true">
          <div className="bg-white rounded-card max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {!decisionDone ? (
              <>
                <h3 className="font-display text-xl mb-1">
                  {decision.action === "publish" ? "Publish this story" : "Reject this story"}
                </h3>
                <p className="font-body text-sm text-ink/60 mb-4">
                  {decision.email
                    ? "This submitter asked to be notified. Confirm the decision, then you'll get a ready-to-send message to email them."
                    : "No email on file for this submitter — this will just record the decision."}
                </p>
                {decision.email && (
                  <textarea
                    value={decisionMsg}
                    onChange={(e) => setDecisionMsg(e.target.value)}
                    rows={9}
                    className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body text-sm mb-4 focus:border-ember outline-none"
                  />
                )}
                <div className="flex gap-2 justify-end flex-wrap">
                  <button onClick={closeDecision}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition">
                    Cancel
                  </button>
                  <button onClick={() => commitDecision(decision.id, decision.action, decisionMsg)}
                    disabled={decisionSending}
                    className={`font-body text-sm px-5 py-2 rounded-full text-white transition disabled:opacity-50 ${
                      decision.action === "publish" ? "bg-tidewater hover:brightness-110" : "bg-ember hover:brightness-110"
                    }`}>
                    {decisionSending ? "Working…" : decision.action === "publish" ? "Publish" : "Reject"}
                  </button>
                </div>
              </>
            ) : (
              // Manual-send panel: the decision is done; now send the email by hand.
              <>
                <h3 className="font-display text-xl mb-1">
                  {decision.action === "publish" ? "Published ✓" : "Rejected"}
                </h3>
                <p className="font-body text-sm text-ink/60 mb-4">
                  Now send this note to the submitter from{" "}
                  <span className="font-mono text-ink">healingstories14@gmail.com</span>. Use the
                  button to open your email, or copy the text.
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
                        ? "Your story is now live on Yet, We Can Heal"
                        : "An update on your story — Yet, We Can Heal"
                    )}&body=${encodeURIComponent(decisionMsg)}`}
                    className="font-body text-sm px-5 py-2 rounded-full bg-ink text-white hover:bg-ember transition"
                  >
                    Open in email
                  </a>
                  <button
                    onClick={() => navigator.clipboard?.writeText(decisionMsg)}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition"
                  >
                    Copy message
                  </button>
                  <button onClick={closeDecision}
                    className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ink/50 transition">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Closing band: gives the dashboard a deliberate end and quick access to
          the main management areas. */}
      <div className="mt-16 pt-8 border-t border-ink/10">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-4">Manage</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/admin/content" className="border border-ink/15 rounded-card p-4 hover:border-ember transition group">
            <p className="font-body font-medium group-hover:text-ember">Stories &amp; Articles</p>
            <p className="font-body text-xs text-ink/50">Search, edit, remove published content</p>
          </Link>
          <Link href="/admin/articles" className="border border-ink/15 rounded-card p-4 hover:border-ember transition group">
            <p className="font-body font-medium group-hover:text-ember">Article Queue</p>
            <p className="font-body text-xs text-ink/50">Review pending &amp; write new</p>
          </Link>
          <Link href="/admin/reports" className="border border-ink/15 rounded-card p-4 hover:border-ember transition group">
            <p className="font-body font-medium group-hover:text-ember">Reports &amp; Feedback</p>
            <p className="font-body text-xs text-ink/50">Reader reports and impact notes</p>
          </Link>
          <Link href="/admin/messages" className="border border-ink/15 rounded-card p-4 hover:border-ember transition group">
            <p className="font-body font-medium group-hover:text-ember">Messages</p>
            <p className="font-body text-xs text-ink/50">Contact form replies</p>
          </Link>
          {isPublisher && (
            <Link href="/admin/activity-log" className="border border-ink/15 rounded-card p-4 hover:border-ember transition group">
              <p className="font-body font-medium group-hover:text-ember">Activity Log</p>
              <p className="font-body text-xs text-ink/50">Who did what, when</p>
            </Link>
          )}
          {role === "super_admin" && (
            <Link href="/admin/team" className="border border-ink/15 rounded-card p-4 hover:border-ember transition group">
              <p className="font-body font-medium group-hover:text-ember">Manage Team</p>
              <p className="font-body text-xs text-ink/50">Roles and access</p>
            </Link>
          )}
        </div>
      </div>
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
