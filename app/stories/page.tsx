"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { createClient } from "@/lib/supabase/client";
import { type Story } from "@/lib/seed-stories";
import { emotions } from "@/lib/emotions";

const PAGE_SIZE = 24;

export default function StoriesPage() {
  return (
    <Suspense fallback={null}>
      <StoriesPageInner />
    </Suspense>
  );
}

function mapStory(s: any): Story {
  return {
    id: s.id,
    title: s.title,
    excerpt: s.body.slice(0, 120) + (s.body.length > 120 ? "..." : ""),
    body: s.body,
    whatHelpedHeal: s.what_helped_heal,
    emotionTags: s.emotion_tags,
    triggerWarning: s.trigger_warning,
    readCount: s.read_count,
    helpfulCount: s.helpful_count,
  };
}

function StoriesPageInner() {
  const searchParams = useSearchParams();
  const initialFeeling = searchParams.get("feeling");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(
    initialFeeling ? [initialFeeling] : []
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_read" | "most_helpful">("newest");
  const [pickerOpen, setPickerOpen] = useState(!!initialFeeling);

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  // Debounce the search box so we query the DB at most every 350ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Build and run a page query against Supabase. Filtering, search and sort all
  // happen in the DB (via .range/.ilike/.overlaps/.order) so we never download
  // the whole table -- this is what lets it scale to thousands of stories.
  const fetchPage = useCallback(
    async (pageIndex: number, replace: boolean) => {
      const supabase = createClient();
      let q = supabase
        .from("stories")
        .select("*", { count: pageIndex === 0 ? "exact" : undefined })
        .eq("status", "approved");

      if (selectedEmotions.length > 0) {
        // overlaps = row's emotion_tags array shares any value with the filter.
        q = q.overlaps("emotion_tags", selectedEmotions);
      }
      if (debouncedQuery.trim()) {
        const term = `%${debouncedQuery.trim()}%`;
        // Search title OR body OR what_helped_heal.
        q = q.or(`title.ilike.${term},body.ilike.${term},what_helped_heal.ilike.${term}`);
      }

      // Sort.
      if (sortBy === "most_read") q = q.order("read_count", { ascending: false });
      else if (sortBy === "most_helpful") q = q.order("helpful_count", { ascending: false });
      else if (sortBy === "oldest") q = q.order("submitted_at", { ascending: true });
      else q = q.order("submitted_at", { ascending: false });

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count } = await q.range(from, to);

      const mapped = (data ?? []).map(mapStory);
      setStories((prev) => (replace ? mapped : [...prev, ...mapped]));
      setHasMore(mapped.length === PAGE_SIZE);
      if (pageIndex === 0 && typeof count === "number") setTotal(count);
    },
    [selectedEmotions, debouncedQuery, sortBy]
  );

  // Reload from page 0 whenever filters/search/sort change.
  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetchPage(0, true).finally(() => setLoading(false));
  }, [fetchPage]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    await fetchPage(next, false);
    setPage(next);
    setLoadingMore(false);
  }

  function toggleEmotion(id: string) {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  // Filter options: the 8 presets always available (DB-side filtering handles
  // custom tags too if a reader picks one, but we surface presets here).
  const filterOptions = useMemo(
    () => emotions.map((e) => ({ id: e.id, name: e.name })),
    []
  );

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
              <option value="oldest">Oldest</option>
              <option value="most_read">Most read</option>
              <option value="most_helpful">Most helpful</option>
            </select>
          </label>

          {total !== null && (
            <span className="font-mono text-xs text-ink/40 ml-auto">
              {total} {total === 1 ? "story" : "stories"}
            </span>
          )}
        </div>

        {selectedEmotions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {selectedEmotions.map((id) => {
              const label = filterOptions.find((e) => e.id === id)?.name ?? id;
              return (
                <span key={id} className="font-mono text-xs uppercase tracking-wide bg-ink text-white px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                  {label}
                  <button onClick={() => toggleEmotion(id)} aria-label={`Remove ${label} filter`} className="hover:opacity-70">✕</button>
                </span>
              );
            })}
            <button onClick={() => setSelectedEmotions([])} className="font-mono text-xs uppercase tracking-wide text-ink/40 hover:text-ember px-2 py-1.5">
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
                  selectedEmotions.includes(e.id) ? "bg-ink text-white border-ink" : "border-ink/20 text-ink/60 hover:border-ink/50"
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
      ) : stories.length === 0 ? (
        <p className="font-body text-ink/60">
          No stories match yet -- but that doesn&apos;t mean you&apos;re alone.{" "}
          <Link href="/stories/submit" className="underline hover:text-ember">
            Be the first to share what helped you.
          </Link>
        </p>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="font-body bg-ink text-white px-8 py-3 rounded-full hover:bg-ember transition disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more stories"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
