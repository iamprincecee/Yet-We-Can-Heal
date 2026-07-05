import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/stories/:id/approve -- Editor or Super Admin.
// This is where the activity log entry gets written -- the whole point
// being that a Super Admin can always see exactly who approved what, and when.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { ctx } = auth;

  const supabase = createClient();
  const body = await request.json().catch(() => ({}));
  const finalEmotionTags: string[] | undefined = body.emotionTags;

  const updatePayload: Record<string, unknown> = {
    status: "approved",
    reviewed_by: ctx.userId,
    reviewed_at: new Date().toISOString(),
  };
  if (finalEmotionTags) updatePayload.emotion_tags = finalEmotionTags;

  const { error } = await supabase.from("stories").update(updatePayload).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: "story_approved",
    target_type: "story",
    target_id: params.id,
  });

  return NextResponse.json({ success: true });
}
