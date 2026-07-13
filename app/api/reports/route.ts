import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/reports -- public, no login. Anyone can flag a story or article.
// Rate limited to curb abuse-of-abuse.
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`report:${ip}`, 8, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You've filed several reports recently. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.contentType || !body?.contentId || !body?.reason) {
    return NextResponse.json({ error: "Missing report details." }, { status: 400 });
  }
  if (!["story", "article"].includes(body.contentType)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("content_reports").insert({
    content_type: body.contentType,
    content_id: body.contentId,
    reason: String(body.reason).slice(0, 200),
    note: body.note ? String(body.note).slice(0, 1000) : null,
    reporter_ip: ip,
    status: "open",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET /api/reports -- any admin can view the reports queue.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data });
}

// PATCH /api/reports -- only publishers (chief editor / super admin) can act
// on a report: mark reviewed, actioned, or dismissed.
export async function PATCH(request: Request) {
  const auth = await requireAdmin({ publisher: true });
  if (!auth.ctx) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = auth.ctx;

  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !["reviewed", "actioned", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("content_reports")
    .update({ status, handled_by: ctx.userId, handled_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
