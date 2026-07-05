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
    { count: storyReads },
    { count: submissions },
    { count: waitlistJoins },
    { data: emotionSelections },
    { data: approvedStories },
    { data: heartbeats },
  ] = await Promise.all([
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "story_read"),
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "submission"),
    supabase.from("site_metrics").select("*", { count: "exact", head: true }).eq("event_type", "waitlist_join"),
    supabase.from("site_metrics").select("emotion").eq("event_type", "emotion_selected"),
    supabase.from("stories").select("emotion_tags").eq("status", "approved"),
    supabase
      .from("site_metrics")
      .select("session_id, created_at")
      .eq("event_type", "heartbeat")
      .not("session_id", "is", null),
  ]);

  // Group heartbeats by session to get unique visitors and engaged time.
  // A session's engaged time = (last heartbeat - first heartbeat). Since
  // heartbeats only fire while the tab is visible, idle/backgrounded time is
  // naturally excluded, making this far more honest than naive time-on-page.
  const sessions: Record<string, { first: number; last: number }> = {};
  for (const row of heartbeats ?? []) {
    const sid = row.session_id as string;
    const t = new Date(row.created_at as string).getTime();
    if (!sessions[sid]) {
      sessions[sid] = { first: t, last: t };
    } else {
      if (t < sessions[sid].first) sessions[sid].first = t;
      if (t > sessions[sid].last) sessions[sid].last = t;
    }
  }

  const sessionIds = Object.keys(sessions);
  const uniqueVisitors = sessionIds.length;

  // Average engaged seconds across sessions. Single-heartbeat sessions (someone
  // who left almost immediately) count as a small floor rather than 0, so the
  // average isn't skewed to nonsense by bounces.
  let avgTimeOnSiteSeconds = 0;
  if (uniqueVisitors > 0) {
    const totalSeconds = sessionIds.reduce((sum, sid) => {
      const { first, last } = sessions[sid];
      const secs = Math.max((last - first) / 1000, 0);
      return sum + secs;
    }, 0);
    avgTimeOnSiteSeconds = Math.round(totalSeconds / uniqueVisitors);
  }

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
    uniqueVisitors,
    avgTimeOnSiteSeconds,
    storyReads: storyReads ?? 0,
    submissions: submissions ?? 0,
    waitlistJoins: waitlistJoins ?? 0,
    mostSelectedEmotions,
    submissionEmotionBreakdown,
  });
}
