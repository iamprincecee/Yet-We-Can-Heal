"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = {
  id: string;
  name: string | null;
  email: string;
  subject: string | null;
  message: string;
  status: "new" | "read" | "archived";
  submitted_at: string;
  reply_draft: string | null;
  reply_sent: string | null;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "archived">("all");
  const [isPublisher, setIsPublisher] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/contact");
      if (res.ok) {
        const data = await res.json();
        const list: Message[] = data.messages ?? [];
        setMessages(list);
        const d: Record<string, string> = {};
        list.forEach((m) => { d[m.id] = m.reply_draft ?? ""; });
        setReplyDraft(d);
      }
      setLoading(false);
    }
    load();
    loadRole();
  }, []);

  async function loadRole() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("admin_profiles").select("role").eq("id", user.id).single();
      const r = profile?.role;
      setIsPublisher(r === "super_admin" || r === "chief_editor");
    }
  }

  async function saveDraft(id: string) {
    const res = await fetch("/api/admin/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, replyDraft: replyDraft[id] ?? "" }),
    });
    if (res.ok) {
      setMsg("Draft saved.");
      setTimeout(() => setMsg(null), 1500);
    }
  }

  async function sendReply(id: string) {
    const res = await fetch("/api/admin/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, replySent: replyDraft[id] ?? "" }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reply_sent: replyDraft[id], status: "read" } : m)));
      setMsg("Reply recorded as sent.");
      setTimeout(() => setMsg(null), 1500);
    } else {
      setMsg((await res.json().catch(() => ({}))).error ?? "Couldn't send.");
    }
  }

  async function setStatus(id: string, status: Message["status"]) {
    const res = await fetch("/api/admin/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    }
  }

  const visible = messages.filter((m) => {
    if (filter === "all") return m.status !== "archived";
    if (filter === "new") return m.status === "new";
    return m.status === "archived";
  });

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <section className="px-6 md:px-16 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">Admin</p>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
          ← Dashboard
        </Link>
      </div>
      <h1 className="font-display text-3xl md:text-4xl mb-6">
        Messages
        {newCount > 0 && (
          <span className="ml-3 align-middle font-mono text-sm bg-ember text-white rounded-full px-3 py-1">
            {newCount} new
          </span>
        )}
      </h1>

      {msg && <p className="font-body text-sm text-tidewater mb-4">{msg}</p>}

      <div className="flex gap-2 mb-8">
        {(["all", "new", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-full border transition-colors ${
              filter === f ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/60 hover:border-ink/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-ink/60">Loading messages...</p>
      ) : visible.length === 0 ? (
        <p className="font-body text-ink/60">No messages here.</p>
      ) : (
        <div className="space-y-4">
          {visible.map((m) => (
            <div
              key={m.id}
              className={`bg-white border rounded-card p-6 ${
                m.status === "new" ? "border-ember/40" : "border-ink/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-body font-medium">
                    {m.name || "Anonymous"}{" "}
                    <a href={`mailto:${m.email}`} className="font-normal text-ink/50 hover:text-ember">
                      &lt;{m.email}&gt;
                    </a>
                  </p>
                  {m.subject && <p className="font-body text-sm text-ink/70">{m.subject}</p>}
                </div>
                <span className="font-mono text-xs text-ink/40 shrink-0">
                  {new Date(m.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <p className="font-body text-sm text-ink/80 whitespace-pre-line mb-4">{m.message}</p>

              {/* Reply workflow: any admin can draft; only publishers can send.
                  Once sent, the sent reply is shown and locked. */}
              {m.reply_sent ? (
                <div className="bg-tidewater/10 border-l-4 border-tidewater rounded-r-lg p-3 mb-4">
                  <p className="font-mono text-xs uppercase tracking-wide text-tidewater mb-1">Reply sent</p>
                  <p className="font-body text-sm text-ink/80 whitespace-pre-line">{m.reply_sent}</p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-1">
                    {isPublisher ? "Draft & send a reply" : "Draft a reply (a Chief Editor will send it)"}
                  </p>
                  <textarea
                    value={replyDraft[m.id] ?? ""}
                    onChange={(e) => setReplyDraft((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    rows={3}
                    placeholder="Write a considered reply…"
                    className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm mb-2 focus:border-ember outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveDraft(m.id)}
                      className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                    >
                      Save draft
                    </button>
                    {isPublisher && (
                      <button
                        onClick={() => sendReply(m.id)}
                        className="font-body text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-ember transition"
                      >
                        Send reply
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject ?? "Your message to Yet, We Can Heal")}`}
                  className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                >
                  Open in email
                </a>
                {m.status === "new" && (
                  <button
                    onClick={() => setStatus(m.id, "read")}
                    className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                  >
                    Mark as read
                  </button>
                )}
                {m.status !== "archived" ? (
                  <button
                    onClick={() => setStatus(m.id, "archived")}
                    className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ember hover:text-ember transition"
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(m.id, "read")}
                    className="font-body text-sm border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 transition"
                  >
                    Unarchive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
