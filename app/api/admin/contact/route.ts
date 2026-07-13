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

// PATCH /api/admin/contact -- update a message. Supports:
//   - status changes (read/archived) by any admin
//   - saving a reply DRAFT by any admin
//   - SENDING a reply (reply_sent) only by publishers (chief editor/super admin)
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = createClient();
  const payload: Record<string, unknown> = {};

  if (body.status) {
    if (!["new", "read", "archived"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    payload.status = body.status;
  }

  // Any admin can save a draft reply.
  if (typeof body.replyDraft === "string") {
    payload.reply_draft = body.replyDraft;
  }

  // Only publishers can SEND a reply (record it as sent).
  if (typeof body.replySent === "string") {
    if (ctx.role !== "super_admin" && ctx.role !== "chief_editor") {
      return NextResponse.json(
        { error: "Only Chief Editors or Super Admins can send replies." },
        { status: 403 }
      );
    }
    payload.reply_sent = body.replySent;
    payload.replied_by = ctx.userId;
    payload.replied_at = new Date().toISOString();
    payload.status = "read";
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase.from("contact_messages").update(payload).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
