import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from("emotions").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emotions: data });
}

// POST here logs a check-in selection for the "most-searched emotions" metric.
export async function POST(request: Request) {
  const supabase = createClient();
  const { emotion } = await request.json();

  if (!emotion) {
    return NextResponse.json({ error: "Emotion is required." }, { status: 400 });
  }

  await supabase.from("site_metrics").insert({ event_type: "emotion_selected", emotion });

  return NextResponse.json({ success: true });
}
