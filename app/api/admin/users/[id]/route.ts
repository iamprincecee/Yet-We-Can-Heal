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
    .select("email, role, is_founder")
    .eq("id", params.id)
    .single();

  // The founder can never be removed by anyone (not even themselves via the
  // self-guard above, but this is a hard stop regardless).
  if (target?.is_founder) {
    return NextResponse.json(
      { error: "The founding Super Admin can't be removed." },
      { status: 400 }
    );
  }

  // Only the FOUNDER may remove another super admin. A regular super admin can
  // remove editors, but not fellow super admins -- this stops a promoted
  // super admin from ousting the owner or each other.
  if (target?.role === "super_admin") {
    const { data: caller } = await admin
      .from("admin_profiles")
      .select("is_founder")
      .eq("id", ctx.userId)
      .single();

    if (!caller?.is_founder) {
      return NextResponse.json(
        { error: "Only the founding Super Admin can remove another Super Admin." },
        { status: 403 }
      );
    }

    // Even the founder can't remove the last super admin (would orphan access).
    const { count } = await admin
      .from("admin_profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        {
          error:
            "You can't remove the last Super Admin — the account system would be locked out.",
        },
        { status: 400 }
      );
    }
  }

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
