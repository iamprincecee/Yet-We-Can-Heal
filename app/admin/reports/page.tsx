"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  content_type: "story" | "article";
  content_id: string;
  reason: string;
  note: string | null;
  status: "open" | "reviewed" | "actioned" | "dismissed";
  created_at: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [feedback, setFeedback] = useState<{ id: string; content_type: string; content_id: string; note: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublisher, setIsPublisher] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/reports");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports ?? []);
    }
    setLoading(false);
  }

  async function loadRole() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("admin_profiles").select("role").eq("id", user.id).single();
      const r = profile?.role;
      setIsPublisher(r === "super_admin" || r === "chief_editor");
    }
  }

  useEffect(() => {
    load();
    loadRole();
    fetch("/api/feedback").then(async (r) => {
      if (r.ok) setFeedback((await r.json()).feedback ?? []);
    }).catch(() => {});
  }, []);

  async function act(id: string, status: "reviewed" | "actioned" | "dismissed") {
    const res = await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) load();
    else setMsg((await res.json().catch(() => ({}))).error ?? "Couldn't update the report.");
  }

  const open = reports.filter((r) => r.status === "open");
  const handled = reports.filter((r) => r.status !== "open");

  return (
    <section className="px-6 md:px-16 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">Admin</p>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">← Dashboard</Link>
      </div>
      <h1 className="font-display text-3xl md:text-4xl mb-2">Reader reports</h1>
      <p className="font-body text-ink/60 mb-8">
        <span className="font-medium text-ink">{open.length}</span> open ·{" "}
        {isPublisher ? "You can act on reports." : "Only Chief Editors and Super Admins can act on reports."}
      </p>

      {msg && <p className="font-body text-sm text-ember mb-4">{msg}</p>}

      {loading ? (
        <p className="font-body text-ink/60">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="font-body text-ink/60">No reports. All quiet.</p>
      ) : (
        <>
          <h2 className="font-display text-xl mb-4">Open ({open.length})</h2>
          {open.length === 0 ? (
            <p className="font-body text-ink/50 mb-8">Nothing needs attention right now.</p>
          ) : (
            <div className="space-y-4 mb-10">
              {open.map((r) => (
                <ReportCard key={r.id} report={r} isPublisher={isPublisher} onAct={act} />
              ))}
            </div>
          )}

          {handled.length > 0 && (
            <>
              <h2 className="font-display text-xl mb-4">Handled ({handled.length})</h2>
              <div className="space-y-3">
                {handled.map((r) => (
                  <ReportCard key={r.id} report={r} isPublisher={isPublisher} onAct={act} handled />
                ))}
              </div>
            </>
          )}
        </>
      )}
      {/* The positive counterpart: anonymous notes from readers about how a
          story or reflection helped them. Read-only, for the team's heart. */}
      {feedback.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl mb-1">Impact feedback ({feedback.length})</h2>
          <p className="font-body text-sm text-ink/50 mb-4">
            Anonymous notes from readers about how published pieces helped them.
          </p>
          <div className="space-y-3">
            {feedback.map((f) => (
              <div key={f.id} className="bg-tidewater/5 border border-tidewater/20 rounded-card p-4">
                <p className="font-body text-sm text-ink/80 mb-2">&ldquo;{f.note}&rdquo;</p>
                <p className="font-mono text-xs text-ink/40">
                  {f.content_type} · {new Date(f.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReportCard({
  report,
  isPublisher,
  onAct,
  handled,
}: {
  report: Report;
  isPublisher: boolean;
  onAct: (id: string, status: "reviewed" | "actioned" | "dismissed") => void;
  handled?: boolean;
}) {
  const href = report.content_type === "story"
    ? `/stories/${report.content_id}`
    : `/articles`; // articles are keyed by slug publicly; link to list as a fallback

  return (
    <div className={`bg-white border rounded-card p-5 ${handled ? "border-ink/10 opacity-70" : "border-ember/30"}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-wide bg-ink/10 text-ink/60 px-2 py-1 rounded-full mr-2">
            {report.content_type}
          </span>
          <span className="font-body font-medium">{report.reason}</span>
        </div>
        <span className="font-mono text-xs text-ink/40 shrink-0">
          {new Date(report.created_at).toLocaleDateString()}
        </span>
      </div>
      {report.note && <p className="font-body text-sm text-ink/70 mb-3">{report.note}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={href} className="font-mono text-xs uppercase tracking-wide text-tidewater hover:text-ember">
          View content ↗
        </Link>
        {!handled && isPublisher && (
          <>
            <button onClick={() => onAct(report.id, "actioned")}
              className="font-body text-sm px-4 py-1.5 rounded-full bg-ember text-white hover:brightness-110 transition">
              Mark actioned
            </button>
            <button onClick={() => onAct(report.id, "dismissed")}
              className="font-body text-sm px-4 py-1.5 rounded-full border border-ink/20 hover:border-ink/50 transition">
              Dismiss
            </button>
          </>
        )}
        {!handled && !isPublisher && (
          <span className="font-mono text-xs uppercase tracking-wide text-ink/40">
            Awaiting a Chief Editor
          </span>
        )}
        {handled && (
          <span className="font-mono text-xs uppercase tracking-wide text-ink/40">
            {report.status}
          </span>
        )}
      </div>
    </div>
  );
}
