import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/stories/:id/read -- public, fired once when a story page loads.
// Also logs a site_metrics event so per-story reads roll up into the
// admin dashboard's "most read stories" view.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { error } = await supabase.rpc("increment_read_count", { story_id: params.id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("site_metrics").insert({ event_type: "story_read", story_id: params.id });

  return NextResponse.json({ success: true });
}
