import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/users -- Super Admin only. Invites a new team member by
// email and assigns their role. The invited person sets their own password
// via the email link Supabase sends -- Super Admins never see or set
// passwords for other people.
export async function POST(request: Request) {
  const auth = await requireAdmin({ superAdmin: true });
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const { email, role } = await request.json().catch(() => ({}));
  if (!email || !["editor", "chief_editor", "super_admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid email or role." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Where the invited person lands after clicking the email link. Supabase
  // appends the invite token; our /auth/callback route exchanges it for a
  // session and forwards them to /admin/set-password to choose a password.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/admin/set-password`,
  });

  if (inviteError || !invited.user) {
    return NextResponse.json({ error: inviteError?.message ?? "Invite failed." }, { status: 500 });
  }

  const { error: profileError } = await admin.from("admin_profiles").insert({
    id: invited.user.id,
    email,
    role,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await admin.from("activity_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action: "admin_added",
    target_type: "admin_profile",
    target_id: invited.user.id,
    details: `Added ${email} as ${role}`,
  });

  return NextResponse.json({ success: true });
}
