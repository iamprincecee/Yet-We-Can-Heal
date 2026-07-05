"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Story } from "@/lib/seed-stories";
import PaintSplash from "@/components/PaintSplash";

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("stories").select("*").eq("id", params.id).single();

      let loaded: Story | null = null;
      if (data) {
        loaded = {
          id: data.id,
          title: data.title,
          excerpt: data.body.slice(0, 120),
          body: data.body,
          whatHelpedHeal: data.what_helped_heal,
          emotionTags: data.emotion_tags,
          triggerWarning: data.trigger_warning,
          readCount: data.read_count,
          helpfulCount: data.helpful_count,
        };
      }

      if (loaded) {
        setStory(loaded);
        setRevealed(!loaded.triggerWarning);
        // Log a real view -- fire and forget, non-blocking for the reader.
        fetch(`/api/stories/${params.id}/read`, { method: "POST" }).catch(() => {});
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleHelpful() {
    setMarkedHelpful(true);
    fetch(`/api/stories/${params.id}/helpful`, { method: "POST" }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="px-6 md:px-16 py-16 max-w-2xl mx-auto">
        <p className="font-body text-ink/50">Loading...</p>
      </div>
    );
  }

  if (!story) return notFound();

  return (
    <article className="px-6 md:px-16 py-16 max-w-2xl mx-auto relative">
      <PaintSplash color="ember" className="absolute -top-8 -left-12 w-28 h-28 opacity-40 -z-10" />

      <Link href="/stories" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
        ← Back to stories
      </Link>

      <div className="flex flex-wrap gap-2 my-6">
        {story.emotionTags.map((tag) => (
          <span key={tag} className="font-mono text-xs uppercase tracking-wide bg-blush text-ink/80 px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {!revealed ? (
        <div className="bg-blush/60 rounded-card p-8 text-center">
          <p className="font-body text-ink/80 mb-4">
            <strong>Trigger warning:</strong> {story.triggerWarning}
          </p>
          <button
            onClick={() => setRevealed(true)}
            className="font-body bg-ink text-white px-6 py-3 rounded-full hover:bg-ember transition"
          >
            I&apos;m ready to read this
          </button>
        </div>
      ) : (
        <>
          {story.title && <h1 className="font-display text-3xl md:text-4xl mb-6">{story.title}</h1>}
          <div className="font-body text-lg leading-relaxed text-ink/90 whitespace-pre-line mb-8">
            {story.body}
          </div>

          <div className="bg-marigold/10 border-l-4 border-marigold rounded-r-card p-6 mb-10">
            <p className="font-mono text-xs uppercase tracking-wide text-marigold mb-2">
              What helped me heal
            </p>
            <p className="font-body text-ink/90">{story.whatHelpedHeal}</p>
          </div>

          <div className="flex items-center justify-between border-t border-ink/10 pt-6">
            <button
              onClick={handleHelpful}
              disabled={markedHelpful}
              className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ember hover:text-ember transition disabled:opacity-50"
            >
              {markedHelpful ? "Thank you for letting us know" : "Was this helpful?"}
            </button>
            <Link href="/stories/submit" className="font-body text-sm px-5 py-2 rounded-full bg-ember text-white hover:brightness-110 transition">
              Share your own story
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
