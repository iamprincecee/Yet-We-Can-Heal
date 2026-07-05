import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/metrics/heartbeat -- public, fired by VisitorTracker every ~15s
// while a visitor's tab is visible. Each row carries the session_id and a
// timestamp; the metrics rollup uses these to compute unique visitors and
// average engaged time per session.
export async function POST(request: Request) {
  const { sessionId } = await request.json().catch(() => ({ sessionId: null }));
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  const supabase = createClient();
  await supabase.from("site_metrics").insert({
    event_type: "heartbeat",
    session_id: sessionId,
  });

  return NextResponse.json({ success: true });
}
