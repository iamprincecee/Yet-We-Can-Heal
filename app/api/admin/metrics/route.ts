import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/metrics -- Editor or Super Admin.
// Rolls up the raw site_metrics event log into the numbers the dashboard
// actually displays: visitor-style counts, most-selected emotions, and the
// emotional inclination of submitted stories.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();

  const [
    { count: pageViews },
    { count: storyReads },
    { count: submissions },
    { count: waitlistJoins },
    { data: emotionSelections },
    { data: approvedStories },
  ] = await Promise.all([
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "page_view"),
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "story_read"),
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "submission"),
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "waitlist_join"),
    supabase.from("site_metrics").select("emotion").eq("event_type", "emotion_selected"),
    supabase.from("stories").select("emotion_tags").eq("status", "approved"),
  ]);

  // Most-selected emotions at check-in
  const emotionCounts: Record<string, number> = {};
  for (const row of emotionSelections ?? []) {
    if (row.emotion) emotionCounts[row.emotion] = (emotionCounts[row.emotion] ?? 0) + 1;
  }
  const mostSelectedEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, count]) => ({ emotion, count }));

  // Emotional inclination of submitted (approved) stories
  const submissionEmotionCounts: Record<string, number> = {};
  for (const story of approvedStories ?? []) {
    for (const tag of story.emotion_tags ?? []) {
      submissionEmotionCounts[tag] = (submissionEmotionCounts[tag] ?? 0) + 1;
    }
  }
  const submissionEmotionBreakdown = Object.entries(submissionEmotionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => ({ emotion, count }));

  return NextResponse.json({
    pageViews: pageViews ?? 0,
    storyReads: storyReads ?? 0,
    submissions: submissions ?? 0,
    waitlistJoins: waitlistJoins ?? 0,
    mostSelectedEmotions,
    submissionEmotionBreakdown,
  });
}
