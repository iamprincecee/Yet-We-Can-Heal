import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE /api/admin/users/:id -- Super Admin only.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin({ superAdmin: true });
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  // Guard against a Super Admin removing their own account and orphaning access.
  if (params.id === ctx.userId) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("admin_profiles")
    .select("email")
    .eq("id", params.id)
    .single();

  const { error } = await admin.from("admin_profiles").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.auth.admin.deleteUser(params.id);

  await admin.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: "admin_removed",
    target_type: "admin_profile",
    target_id: params.id,
    details: `Removed ${target?.email ?? params.id}`,
  });

  return NextResponse.json({ success: true });
}
