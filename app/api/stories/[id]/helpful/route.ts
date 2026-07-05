import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/stories/:id/helpful -- public, no login required.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { error } = await supabase.rpc("increment_helpful_count", { story_id: params.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
