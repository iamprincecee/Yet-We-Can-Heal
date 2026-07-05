import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/team-profiles -- any admin can view the list.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data });
}

// POST /api/admin/team-profiles -- Super Admin only. Creates a member.
export async function POST(request: Request) {
  const auth = await requireAdmin({ superAdmin: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { name, role, bio, photo_url, sort_order } = await request.json().catch(() => ({}));
  if (!name || !role) {
    return NextResponse.json({ error: "Name and role are required." }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      name,
      role,
      bio: bio || null,
      photo_url: photo_url || null,
      sort_order: sort_order ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
