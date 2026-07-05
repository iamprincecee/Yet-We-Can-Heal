"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { createClient } from "@/lib/supabase/client";
import { type Story } from "@/lib/seed-stories";

// Shows up to 3 of the most recent approved stories on the homepage.
// If there are none yet, the whole section hides itself -- no fake previews.
export default function StoryPreviews() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false })
        .limit(3);

      if (data) {
        setStories(
          data.map((s: any) => ({
            id: s.id,
            title: s.title,
            excerpt: s.body.slice(0, 120) + (s.body.length > 120 ? "..." : ""),
            body: s.body,
            whatHelpedHeal: s.what_helped_heal,
            emotionTags: s.emotion_tags,
            triggerWarning: s.trigger_warning,
            readCount: s.read_count,
            helpfulCount: s.helpful_count,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  // Don't render the section at all while loading or when there's nothing real.
  if (loading || stories.length === 0) return null;

  return (
    <section className="px-6 md:px-16 pb-24 relative">
      <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl">Stories from people who healed</h2>
        <Link href="/stories" className="font-mono text-xs uppercase tracking-wide hover:text-ember">
          View all →
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}
