import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/articles -- any admin. Lists all articles (all statuses),
// newest first, plus a published count.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publishedCount = (data ?? []).filter((a) => a.status === "approved").length;
  return NextResponse.json({ articles: data, publishedCount });
}

// POST /api/admin/articles -- any admin writes an article directly (publishes
// immediately as approved, since an admin is authoring it).
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { title, excerpt, body, emotionTags, slug, isAnonymous, authorName, authorLink } =
    await request.json().catch(() => ({}));

  if (!title || !body || !slug) {
    return NextResponse.json({ error: "Title, body, and slug are required." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("articles").insert({
    slug: slugify(slug),
    title,
    excerpt: excerpt || body.slice(0, 140),
    body,
    emotion_tags: emotionTags ?? [],
    status: "approved",
    is_anonymous: isAnonymous !== false,
    author_name: isAnonymous === false ? authorName?.trim() || null : null,
    author_link: isAnonymous === false ? authorLink?.trim() || null : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
