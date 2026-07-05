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
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "archived">("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/contact");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

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
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject ?? "Your message to Yet, We Can Heal")}`}
                  className="font-body text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-ember transition"
                >
                  Reply by email
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
