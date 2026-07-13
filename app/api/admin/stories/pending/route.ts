import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/stories/pending -- Editor or Super Admin only.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .in("status", ["pending", "ready"])
    .order("submitted_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Published stories too, so publishers can manage/edit them post-publication.
  const { data: published } = await supabase
    .from("stories")
    .select("id, title, body, what_helped_heal, emotion_tags, trigger_warning, image_url, read_count, helpful_count")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ stories: data, published: published ?? [] });
}
