import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/team-profiles/upload -- Super Admin only.
// Accepts a multipart form with a "file" field, uploads it to the
// team-photos bucket using the service-role key (which bypasses storage RLS),
// and returns the public URL. Doing the upload server-side avoids the
// browser-session-not-seen-at-storage-layer problem that can make direct
// client uploads fail RLS even for a legitimate Super Admin.
export async function POST(request: Request) {
  const auth = await requireAdmin({ superAdmin: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Basic guardrails: images only, under 5MB.
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("team-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data } = admin.storage.from("team-photos").getPublicUrl(path);
  return NextResponse.json({ success: true, url: data.publicUrl });
}
