import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/admin/stories/:id -- Chief Editor or Super Admin only.
// Permanently removes a submission. Logged to the activity trail.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin({ publisher: true });
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const supabase = createClient();
  const { error } = await supabase.from("stories").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: "story_deleted",
    target_type: "story",
    target_id: params.id,
  });

  return NextResponse.json({ success: true });
}
