import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { alias, contact, motivation } = await request.json();

  if (!alias || !contact || !motivation) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const { error } = await supabase.from("volunteer_applications").insert({
    alias,
    contact,
    motivation,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
