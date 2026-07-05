import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/contact -- Editor or Super Admin. Lists all messages,
// newest first.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}

// PATCH /api/admin/contact -- mark a message as read or archived.
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !["new", "read", "archived"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
