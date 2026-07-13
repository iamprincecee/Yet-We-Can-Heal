import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/stories/:id/edit -- Editor or Super Admin.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const supabase = createClient();
  const updates = await request.json().catch(() => ({}));
  const allowedFields = ["title", "body", "what_helped_heal", "emotion_tags", "trigger_warning", "image_url"];
  const payload: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) payload[key] = updates[key];
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
  }

  // Fetch current state: needed to (a) snapshot the original before the first
  // edit, so Chief Editors can compare, and (b) gate post-publish edits.
  const { data: current } = await supabase
    .from("stories")
    .select("status, title, body, what_helped_heal, original_body")
    .eq("id", params.id)
    .single();

  if (!current) return NextResponse.json({ error: "Story not found." }, { status: 404 });

  // Published content may only be edited by publishers (chief editor / super admin).
  if (current.status === "approved" && ctx.role !== "super_admin" && ctx.role !== "chief_editor") {
    return NextResponse.json(
      { error: "Only Chief Editors or Super Admins can edit published stories." },
      { status: 403 }
    );
  }

  // First edit? Preserve the untouched original for review comparison.
  if (!current.original_body) {
    payload.original_title = current.title;
    payload.original_body = current.body;
    payload.original_what_helped = current.what_helped_heal;
  }

  const { error } = await supabase.from("stories").update(payload).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: "story_edited",
    target_type: "story",
    target_id: params.id,
    details: `Fields changed: ${Object.keys(payload).join(", ")}`,
  });

  return NextResponse.json({ success: true });
}
