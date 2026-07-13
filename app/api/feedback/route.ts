import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/feedback -- public. After marking a story/article helpful, a
// reader may leave a short note about how it helped. The positive counterpart
// to /api/reports.
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`feedback:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Please try again a little later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!note || !body?.contentType || !body?.contentId) {
    return NextResponse.json({ error: "Missing feedback details." }, { status: 400 });
  }
  if (!["story", "article"].includes(body.contentType)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("content_feedback").insert({
    content_type: body.contentType,
    content_id: body.contentId,
    note,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET /api/feedback -- any admin can read impact feedback.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
