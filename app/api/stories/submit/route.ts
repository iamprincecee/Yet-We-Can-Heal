import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/stories/submit -- open to anonymous visitors, no login required.
// RLS enforces status='pending' regardless of what's sent, so there's no
// way for a submission to sneak onto the public feed without review.
//
// Rate limited to prevent someone flooding the moderation queue: at most
// 5 submissions per IP per hour. Genuine submitters won't hit this; a spam
// script will.
export async function POST(request: Request) {
  const limit = rateLimit(`submit:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You've submitted a few stories already. Please try again a little later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // Use the admin client for the insert. Submission is a controlled public
  // action (we force status='pending' below), and the anon client hits an
  // RLS trap: the insert policy allows INSERT, but the public SELECT policy
  // only exposes APPROVED stories, so the ".select() the new row back" step
  // fails RLS and surfaces as a violation. The admin client sidesteps that.
  const supabase = createAdminClient();
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { title, body: storyBody, whatHelpedHeal, emotionTags, otherEmotion, notifyEmail } = body;

  if (!storyBody || !whatHelpedHeal) {
    return NextResponse.json({ error: "Story and 'what helped you heal' are required." }, { status: 400 });
  }

  // Optional: an email used ONLY to notify the submitter when published.
  const email = typeof notifyEmail === "string" ? notifyEmail.trim() : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right — or leave it empty." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({
      title: title || null,
      body: storyBody,
      what_helped_heal: whatHelpedHeal,
      emotion_tags: emotionTags ?? [],
      other_emotion: otherEmotion || null,
      notify_email: email || null,
      status: "pending", // forced -- never trust client for this
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("site_metrics").insert({ event_type: "submission" });

  return NextResponse.json({ success: true, id: data.id });
}
