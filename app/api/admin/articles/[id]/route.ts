import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// PATCH /api/admin/articles/:id -- approve, reject, or edit an article.
// Body may include: action ('approve'|'reject'), slug, emotionTags, and any
// editable fields (title, excerpt, body, author_name, author_link).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const updates = await request.json().catch(() => ({}));
  const supabase = createClient();
  const payload: Record<string, unknown> = {};

  // Editable content fields.
  for (const key of ["title", "excerpt", "body", "author_name", "author_link", "image_url", "trigger_warning"]) {
    if (key in updates) payload[key] = updates[key];
  }
  if ("emotionTags" in updates) payload.emotion_tags = updates.emotionTags;

  if (updates.action === "ready") {
    // Any admin can mark an article ready for final review.
    payload.status = "ready";
    payload.readied_by = ctx.userId;
    payload.readied_at = new Date().toISOString();
    if (updates.slug?.trim()) payload.slug = slugify(updates.slug);
  } else if (updates.action === "publish") {
    // Final publish requires publisher role.
    if (ctx.role !== "super_admin" && ctx.role !== "chief_editor") {
      return NextResponse.json(
        { error: "Only Chief Editors or Super Admins can publish." },
        { status: 403 }
      );
    }
    if (!updates.slug?.trim()) {
      return NextResponse.json({ error: "A slug is required to publish." }, { status: 400 });
    }
    payload.status = "approved";
    payload.slug = slugify(updates.slug);
  } else if (updates.action === "reject") {
    payload.status = "rejected";
    if (updates.reason) payload.admin_notes = updates.reason;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Fetch current state for original-snapshotting and post-publish gating.
  const { data: current } = await supabase
    .from("articles")
    .select("status, title, excerpt, body, original_body")
    .eq("id", params.id)
    .single();

  if (!current) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  // Published articles may only be edited by publishers.
  const editsContent = ["title", "excerpt", "body", "emotion_tags", "trigger_warning", "image_url"]
    .some((k) => k in payload);
  if (
    current.status === "approved" &&
    editsContent &&
    ctx.role !== "super_admin" &&
    ctx.role !== "chief_editor"
  ) {
    return NextResponse.json(
      { error: "Only Chief Editors or Super Admins can edit published articles." },
      { status: 403 }
    );
  }

  // First content edit? Preserve the original for review comparison.
  if (!current.original_body && editsContent) {
    payload.original_title = current.title;
    payload.original_excerpt = current.excerpt;
    payload.original_body = current.body;
  }

  const { error } = await supabase.from("articles").update(payload).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/articles/:id -- Chief Editor or Super Admin only.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin({ publisher: true });
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { error } = await supabase.from("articles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
