import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/team-profiles/:id -- Super Admin only. Edit a member.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin({ superAdmin: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const updates = await request.json().catch(() => ({}));
  const allowed = ["name", "role", "bio", "photo_url", "sort_order"];
  const payload: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) payload[key] = updates[key];
  }
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("team_members").update(payload).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/team-profiles/:id -- Super Admin only. Remove a member.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin({ superAdmin: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
