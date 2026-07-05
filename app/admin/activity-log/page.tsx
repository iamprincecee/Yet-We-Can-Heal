"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LogEntry = {
  id: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
};

const actionLabels: Record<string, string> = {
  story_approved: "approved a story",
  story_rejected: "rejected a story",
  story_edited: "edited a story",
  admin_added: "added a team member",
  admin_removed: "removed a team member",
};

export default function ActivityLogPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity-log")
      .then((res) => res.json())
      .then((data) => setLog(data.log ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-6 md:px-16 py-12 max-w-3xl mx-auto">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
        ← Back to dashboard
      </Link>
      <h1 className="font-display text-3xl mt-4 mb-2">Activity log</h1>
      <p className="font-body text-ink/60 mb-8">
        Every approval, rejection, edit, and team change -- who did it, and when.
      </p>

      {loading ? (
        <p className="font-body text-ink/50">Loading...</p>
      ) : log.length === 0 ? (
        <p className="font-body text-ink/50">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {log.map((entry) => (
            <div key={entry.id} className="bg-white border border-ink/10 rounded-card p-4">
              <p className="font-body text-sm">
                <span className="font-medium">{entry.actor_email}</span>{" "}
                {actionLabels[entry.action] ?? entry.action}
                {entry.details && <span className="text-ink/60"> -- {entry.details}</span>}
              </p>
              <p className="font-mono text-xs text-ink/40 mt-1">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
