import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/metrics/page-view -- public, fired on each page load by
// PageViewTracker. Anonymous visitors can insert metric events (per RLS).
export async function POST() {
  const supabase = createClient();
  await supabase.from("site_metrics").insert({ event_type: "page_view" });
  return NextResponse.json({ success: true });
}
