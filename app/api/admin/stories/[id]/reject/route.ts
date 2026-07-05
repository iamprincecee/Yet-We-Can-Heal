import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/stories/:id/reject -- Editor or Super Admin.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const supabase = createClient();
  const { reason } = await request.json().catch(() => ({ reason: null }));

  const { error } = await supabase
    .from("stories")
    .update({
      status: "rejected",
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      admin_notes: reason ?? null,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: "story_rejected",
    target_type: "story",
    target_id: params.id,
    details: reason ?? undefined,
  });

  return NextResponse.json({ success: true });
}
