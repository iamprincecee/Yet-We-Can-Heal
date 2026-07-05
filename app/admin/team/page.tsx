"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; email: string; role: "super_admin" | "editor"; is_founder: boolean };

export default function TeamManagementPage() {
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"super_admin" | "editor">("editor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentIsFounder, setCurrentIsFounder] = useState(false);

  async function loadTeam() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const { data } = await supabase.from("admin_profiles").select("id, email, role, is_founder");
    const members = (data as Member[]) ?? [];
    setTeam(members);
    setCurrentIsFounder(members.find((m) => m.id === user?.id)?.is_founder ?? false);
    setLoading(false);
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setNewEmail("");
    setSubmitting(false);
    await loadTeam();
  }

  async function removeMember(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTeam((prev) => prev.filter((m) => m.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't remove that member.");
    }
  }

  return (
    <section className="px-6 md:px-16 py-12 max-w-2xl mx-auto">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
        ← Back to dashboard
      </Link>
      <h1 className="font-display text-3xl mt-4 mb-8">Manage team access</h1>

      {error && <p className="font-body text-sm text-ember mb-4">{error}</p>}

      {loading ? (
        <p className="font-body text-ink/50 mb-10">Loading team...</p>
      ) : (
        <div className="space-y-3 mb-10">
          {team.map((member) => {
            const isSelf = member.id === currentUserId;
            // Who can this viewer remove?
            //  - never the founder
            //  - never yourself
            //  - another super admin: only if you are the founder
            //  - editors: any super admin can
            const canRemove =
              !member.is_founder &&
              !isSelf &&
              (member.role !== "super_admin" || currentIsFounder);

            return (
              <div key={member.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-card p-4">
                <div>
                  <p className="font-body">
                    {member.email}
                    {isSelf && <span className="text-ink/40 font-normal"> (you)</span>}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-wide text-ink/50">
                    {member.is_founder
                      ? "Founder · Super Admin"
                      : member.role === "super_admin"
                        ? "Super Admin"
                        : "Editor"}
                  </p>
                </div>
                {canRemove ? (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="font-mono text-xs uppercase tracking-wide text-ink/40 hover:text-ember"
                  >
                    Remove
                  </button>
                ) : (
                  <span className="font-mono text-xs uppercase tracking-wide text-ink/20" title={
                    member.is_founder ? "The founder can't be removed" :
                    isSelf ? "You can't remove yourself" :
                    "Only the founder can remove a Super Admin"
                  }>
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={addMember} className="bg-white border border-ink/10 rounded-card p-6 space-y-4">
        <h2 className="font-display text-lg">Add a team member</h2>
        <p className="font-body text-sm text-ink/60">
          They&apos;ll get an email invite to set their own password -- you never see or set it.
        </p>
        <input
          type="email"
          required
          placeholder="name@yetwecanheal.org"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as "super_admin" | "editor")}
          className="w-full border border-ink/20 rounded-xl px-4 py-3 font-body focus:border-ember outline-none"
        >
          <option value="editor">Editor -- review, approve, edit stories</option>
          <option value="super_admin">Super Admin -- full access + team management</option>
        </select>
        {error && <p className="font-body text-sm text-ember">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="font-body bg-ember text-white px-6 py-3 rounded-full font-medium hover:brightness-110 transition disabled:opacity-50"
        >
          {submitting ? "Inviting..." : "Add member"}
        </button>
      </form>
    </section>
  );
}
