import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { error } = await supabase.from("waitlist_signups").insert({ email });

  if (error) {
    // Unique constraint violation = already on the list; treat as success.
    if (error.code === "23505") {
      return NextResponse.json({ success: true, alreadyJoined: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("site_metrics").insert({ event_type: "waitlist_join" });

  return NextResponse.json({ success: true });
}
