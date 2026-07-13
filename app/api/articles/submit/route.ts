import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/articles/submit -- open to anyone, no login. RLS forces
// status='pending'. Rate limited to 5 per IP per hour to curb spam.
export async function POST(request: Request) {
  const limit = rateLimit(`article:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You've submitted a few pieces already. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { title, excerpt, body: articleBody, emotionTags, isAnonymous, authorName, notifyEmail } =
    body;

  if (!title || !articleBody) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  }

  // If they chose to be credited, a name is required.
  if (!isAnonymous && !authorName?.trim()) {
    return NextResponse.json(
      { error: "Please provide your name, or choose to stay anonymous." },
      { status: 400 }
    );
  }

  // Optional: an email used ONLY to notify the submitter when published.
  const email = typeof notifyEmail === "string" ? notifyEmail.trim() : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right — or leave it empty." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("articles").insert({
    slug: null, // admin assigns a clean slug at approval
    title,
    excerpt: excerpt || articleBody.slice(0, 140),
    body: articleBody,
    emotion_tags: emotionTags ?? [],
    status: "pending",
    is_anonymous: isAnonymous !== false,
    author_name: isAnonymous === false ? authorName.trim() : null,
    author_link: null,
    notify_email: email || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
