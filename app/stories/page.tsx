"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { createClient } from "@/lib/supabase/client";
import { type Story } from "@/lib/seed-stories";
import { emotions } from "@/lib/emotions";

export default function StoriesPage() {
  return (
    <Suspense fallback={null}>
      <StoriesPageInner />
    </Suspense>
  );
}

function StoriesPageInner() {
  const searchParams = useSearchParams();
  const initialFeeling = searchParams.get("feeling");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(
    initialFeeling ? [initialFeeling] : []
  );
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "most_read" | "most_helpful">("newest");
  const [pickerOpen, setPickerOpen] = useState(!!initialFeeling);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false });

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

  function toggleEmotion(id: string) {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  // The filter list is the eight presets PLUS any other emotion tags that
  // actually appear on live stories (e.g. a custom "betrayed" tag an admin
  // approved). This keeps the reader's filter in sync with what's genuinely
  // in the collection -- no dead options, and custom tags become filterable
  // the moment a story using them is published.
  const filterOptions = useMemo(() => {
    const presetIds = new Set(emotions.map((e) => e.id));
    const options = emotions.map((e) => ({ id: e.id, name: e.name }));
    const seen = new Set<string>();
    for (const story of stories) {
      for (const tag of story.emotionTags) {
        if (!presetIds.has(tag) && !seen.has(tag)) {
          seen.add(tag);
          // Title-case a raw tag for display, keep the raw value as the id.
          options.push({ id: tag, name: tag.charAt(0).toUpperCase() + tag.slice(1) });
        }
      }
    }
    return options;
  }, [stories]);

  const filtered = useMemo(() => {
    let result = stories;

    if (selectedEmotions.length > 0) {
      result = result.filter((s) => s.emotionTags.some((tag) => selectedEmotions.includes(tag)));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      // Search across the actual story content -- title, body, what helped,
      // and emotion tags -- not just the tags.
      result = result.filter((s) => {
        const haystack = [
          s.title ?? "",
          s.body,
          s.whatHelpedHeal,
          s.emotionTags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort a shallow copy so we never mutate state. "Newest" keeps the order
    // the stories arrived in (the DB query already returns newest-first).
    const sorted = [...result];
    if (sortBy === "most_read") {
      sorted.sort((a, b) => b.readCount - a.readCount);
    } else if (sortBy === "most_helpful") {
      sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }
    return sorted;
  }, [stories, selectedEmotions, query, sortBy]);

  return (
    <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
          {selectedEmotions.length > 0 ? "Filtered stories" : "All stories"}
        </p>
        <h1 className="font-display text-3xl md:text-4xl">
          {selectedEmotions.length > 0
            ? "You're not the only one who's felt this way."
            : "Healing stories"}
        </h1>
      </div>

      <div className="relative mb-4 max-w-xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stories — a word, a feeling, a theme..."
          aria-label="Search stories"
          className="w-full border border-ink/20 rounded-full pl-12 pr-4 py-3 font-body focus:border-ember outline-none"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
        </svg>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="font-mono text-xs uppercase tracking-wide border border-ink/20 px-4 py-2 rounded-full hover:border-ink/50 inline-flex items-center gap-2"
          >
            Filter by feeling
            {selectedEmotions.length > 0 && (
              <span className="bg-ink text-white rounded-full px-2 py-0.5">{selectedEmotions.length}</span>
            )}
            <span className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`}>▾</span>
          </button>

          <label className="font-mono text-xs uppercase tracking-wide text-ink/50 inline-flex items-center gap-2">
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="font-mono text-xs uppercase tracking-wide border border-ink/20 rounded-full px-3 py-2 bg-white focus:border-ember outline-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="most_read">Most read</option>
              <option value="most_helpful">Most helpful</option>
            </select>
          </label>

          <span className="font-mono text-xs text-ink/40 ml-auto">
            {filtered.length} {filtered.length === 1 ? "story" : "stories"}
          </span>
        </div>

        {/* Active filter chips -- always-visible summary of what's applied */}
        {selectedEmotions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {selectedEmotions.map((id) => {
              const label = filterOptions.find((e) => e.id === id)?.name ?? id;
              return (
                <span
                  key={id}
                  className="font-mono text-xs uppercase tracking-wide bg-ink text-white px-3 py-1.5 rounded-full inline-flex items-center gap-2"
                >
                  {label}
                  <button
                    onClick={() => toggleEmotion(id)}
                    aria-label={`Remove ${label} filter`}
                    className="hover:opacity-70"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => setSelectedEmotions([])}
              className="font-mono text-xs uppercase tracking-wide text-ink/40 hover:text-ember px-2 py-1.5"
            >
              Clear all
            </button>
          </div>
        )}

        {pickerOpen && (
          <div className="flex flex-wrap gap-2 bg-white border border-ink/10 rounded-card p-4">
            {filterOptions.map((e) => (
              <button
                key={e.id}
                onClick={() => toggleEmotion(e.id)}
                className={`font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
                  selectedEmotions.includes(e.id)
                    ? "bg-ink text-white border-ink"
                    : "border-ink/20 text-ink/60 hover:border-ink/50"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="font-body text-ink/50">Loading stories...</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-ink/60">
          No stories match yet -- but that doesn&apos;t mean you&apos;re alone.{" "}
          <Link href="/stories/submit" className="underline hover:text-ember">
            Be the first to share what helped you.
          </Link>
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </section>
  );
}
