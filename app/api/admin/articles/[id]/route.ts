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
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const updates = await request.json().catch(() => ({}));
  const supabase = createClient();
  const payload: Record<string, unknown> = {};

  // Editable content fields.
  for (const key of ["title", "excerpt", "body", "author_name", "author_link"]) {
    if (key in updates) payload[key] = updates[key];
  }
  if ("emotionTags" in updates) payload.emotion_tags = updates.emotionTags;

  if (updates.action === "approve") {
    // A slug is required to publish (used in the public URL).
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

  const { error } = await supabase.from("articles").update(payload).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/articles/:id -- remove an article.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { error } = await supabase.from("articles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
