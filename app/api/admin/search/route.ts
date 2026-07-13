import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/search?type=story|article&q=...  -- any admin.
// Searches PUBLISHED content by title/body so a piece can always be found for
// touch-ups regardless of age. Returns up to 30 matches.
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "article" ? "article" : "story";
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10));
  const PAGE = 20;
  const from = page * PAGE;

  const supabase = createClient();
  const term = `%${q}%`;

  if (type === "story") {
    let query = supabase
      .from("stories")
      .select("id, title, body, emotion_tags, trigger_warning, image_url, read_count, helpful_count, what_helped_heal", { count: "exact" })
      .eq("status", "approved");
    if (q) query = query.or(`title.ilike.${term},body.ilike.${term},what_helped_heal.ilike.${term}`);
    const { data, error, count } = await query
      .order("reviewed_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data ?? [], total: count ?? 0, hasMore: (data ?? []).length === PAGE });
  } else {
    let query = supabase
      .from("articles")
      .select("id, slug, title, excerpt, body, emotion_tags, trigger_warning, image_url, is_anonymous, author_name", { count: "exact" })
      .eq("status", "approved");
    if (q) query = query.or(`title.ilike.${term},excerpt.ilike.${term},body.ilike.${term}`);
    const { data, error, count } = await query
      .order("submitted_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data ?? [], total: count ?? 0, hasMore: (data ?? []).length === PAGE });
  }
}
