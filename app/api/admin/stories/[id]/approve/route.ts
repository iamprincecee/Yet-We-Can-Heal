import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/stories/:id/approve
// Two-step publishing (no automatic email -- notifications are sent manually
// by a publisher from the official Gmail using the templates the dashboard
// provides):
//   action: "ready"   -> any admin marks a story ready for final review
//   action: "publish" -> ONLY chief_editor/super_admin makes it public
//   action: "reject"  -> ONLY chief_editor/super_admin rejects
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const supabase = createClient();
  const body = await request.json().catch(() => ({}));
  const action: "ready" | "publish" | "reject" =
    body.action === "publish" ? "publish" : body.action === "reject" ? "reject" : "ready";

  const updatePayload: Record<string, unknown> = {};
  if (body.emotionTags) updatePayload.emotion_tags = body.emotionTags;
  if (typeof body.imageUrl === "string" || body.imageUrl === null) {
    updatePayload.image_url = body.imageUrl;
  }
  if (typeof body.triggerWarning === "string" || body.triggerWarning === null) {
    updatePayload.trigger_warning = body.triggerWarning;
  }

  const isPublisher = ctx.role === "super_admin" || ctx.role === "chief_editor";

  if (action === "ready") {
    updatePayload.status = "ready";
    updatePayload.readied_by = ctx.userId;
    updatePayload.readied_at = new Date().toISOString();
  } else if (action === "publish") {
    if (!isPublisher) {
      return NextResponse.json({ error: "Only Chief Editors or Super Admins can publish." }, { status: 403 });
    }
    updatePayload.status = "approved";
    updatePayload.reviewed_by = ctx.userId;
    updatePayload.reviewed_at = new Date().toISOString();
  } else {
    if (!isPublisher) {
      return NextResponse.json({ error: "Only Chief Editors or Super Admins can reject." }, { status: 403 });
    }
    updatePayload.status = "rejected";
    updatePayload.reviewed_by = ctx.userId;
    updatePayload.reviewed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("stories").update(updatePayload).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: action === "ready" ? "story_readied" : action === "publish" ? "story_published" : "story_rejected",
    target_type: "story",
    target_id: params.id,
  });

  return NextResponse.json({ success: true });
}
