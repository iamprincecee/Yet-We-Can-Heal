"use client";

import { useState, useEffect } from "react";
import PaintSplash from "@/components/PaintSplash";
import { createClient } from "@/lib/supabase/client";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="bg-white border border-ink/10 rounded-card p-6 text-center">
      <div className="w-24 h-24 mx-auto mb-4">
        {member.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photo_url} alt={member.name} className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blush flex items-center justify-center font-display text-2xl text-ink/60">
            {initials(member.name)}
          </div>
        )}
      </div>
      <h3 className="font-display text-lg">{member.name}</h3>
      <p className="font-mono text-xs uppercase tracking-wide text-ink/50 mb-3">{member.role}</p>
      {member.bio && <p className="font-body text-sm text-ink/70 leading-relaxed">{member.bio}</p>}
    </div>
  );
}

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      const supabase = createClient();
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      setTeam(data ?? []);
      setLoadingTeam(false);
    }
    loadTeam();
  }, []);

  return (
    <section className="px-6 md:px-16 py-16 max-w-5xl mx-auto">
      <div className="max-w-2xl mb-16 relative">
        <PaintSplash color="marigold" className="absolute -top-10 -left-10 w-28 h-28 opacity-50 -z-10" />
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-3">
          About us
        </p>
        <h1 className="font-display text-3xl md:text-4xl mb-6">
          Why we built Yet, We Can Heal
        </h1>
        <p className="font-body text-ink/80 leading-relaxed mb-4">
          This project started with a simple, stubborn belief: that healing stories have
          power. That when someone reads about a person who felt exactly what they feel
          now — and found their way through it — something in them shifts.
        </p>
        <p className="font-body text-ink/80 leading-relaxed">
          We&apos;re not therapists, and this isn&apos;t a replacement for professional
          care. We&apos;re a small team who cared enough about this to build something —
          a quiet place for people who aren&apos;t ready for formal help, or just need to
          know they&apos;re not the only one who&apos;s felt this way.
        </p>
      </div>

      {(loadingTeam || team.length > 0) && (
        <div className="mb-16">
          <h2 className="font-display text-2xl mb-8">The team</h2>
          {loadingTeam ? (
            <p className="font-body text-ink/50">Loading team...</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-ink text-white rounded-card p-10 relative overflow-hidden mb-16">
        <PaintSplash color="tidewater" className="absolute -bottom-16 -right-16 w-56 h-56 opacity-30 -z-0" />
        <h2 className="font-display text-2xl mb-4 relative z-10">What inspired this project</h2>
        <p className="font-body text-white/80 leading-relaxed max-w-2xl relative z-10">
          [To b written should contain the team&apos;s own account of the moment, conversation,
          or shared experience that led to building Yet, We Can Heal. This is the heart
          of the About page, so it&apos;s worth writing in your own words.]
        </p>
      </div>

      <ContactSection />
    </section>
  );
}

// Contact emails shown on the About page. Swap these placeholders for the
// team's real addresses when ready.
const CONTACT_EMAILS = [
  { label: "General enquiries", email: "hello@yetwecanheal.org" },
  { label: "Support & safety", email: "support@yetwecanheal.org" },
  { label: "Volunteering & partnerships", email: "team@yetwecanheal.org" },
];

function ContactSection() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name") || null,
        email: formData.get("email"),
        subject: formData.get("subject") || null,
        message: formData.get("message"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
  }

  return (
    <div id="contact" className="scroll-mt-24">
      <h2 className="font-display text-2xl mb-3">Contact us</h2>
      <p className="font-body text-ink/70 mb-8 max-w-2xl">
        Whether you have a question, need support, or want to get involved — reach out.
        You can email us directly, or send a message below and it&apos;ll reach the whole team.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Direct emails */}
        <div className="space-y-4">
          {CONTACT_EMAILS.map((c) => (
            <div key={c.email} className="bg-white border border-ink/10 rounded-card p-5">
              <p className="font-mono text-xs uppercase tracking-wide text-ink/50 mb-1">
                {c.label}
              </p>
              <a
                href={`mailto:${c.email}`}
                className="font-body text-ink hover:text-ember transition-colors break-all"
              >
                {c.email}
              </a>
            </div>
          ))}
          <p className="font-body text-xs text-ink/40">
            If you&apos;re in crisis, please see our{" "}
            <a href="/crisis-resources" className="underline hover:text-ember">
              crisis resources
            </a>{" "}
            — a message here isn&apos;t monitored around the clock.
          </p>
        </div>

        {/* Contact form */}
        <div className="bg-white border border-ink/10 rounded-card p-6">
          {sent ? (
            <div className="text-center py-8">
              <h3 className="font-display text-xl mb-2">Message sent.</h3>
              <p className="font-body text-sm text-ink/70">
                Thank you for reaching out. Our team will see it and get back to you at the
                email you provided.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium mb-1" htmlFor="c-name">
                  Name <span className="text-ink/40 font-normal">(optional)</span>
                </label>
                <input
                  id="c-name"
                  name="name"
                  type="text"
                  className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium mb-1" htmlFor="c-email">
                  Your email
                </label>
                <input
                  id="c-email"
                  name="email"
                  type="email"
                  required
                  className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                  placeholder="So we can reply"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium mb-1" htmlFor="c-subject">
                  Subject <span className="text-ink/40 font-normal">(optional)</span>
                </label>
                <input
                  id="c-subject"
                  name="subject"
                  type="text"
                  className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium mb-1" htmlFor="c-message">
                  Message
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  required
                  rows={5}
                  className="w-full border border-ink/20 rounded-xl px-4 py-2.5 font-body text-sm focus:border-ember outline-none"
                />
              </div>
              {error && <p className="font-body text-sm text-ember">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="font-body bg-ink text-white px-6 py-3 rounded-full font-medium hover:bg-ember transition disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
