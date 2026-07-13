"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PaintSplash from "@/components/PaintSplash";
import { createClient } from "@/lib/supabase/client";
import { emotionColor, dominantEmotionColor, emotions } from "@/lib/emotions";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  emotion_tags: string[];
  is_anonymous: boolean;
  author_name: string | null;
  submitted_at?: string;
};

type Sort = "newest" | "oldest" | "named" | "anonymous";

// A single article card with an emotion-tied glow (tinted by its first tag)
// that intensifies on hover, plus colour-coded emotion chips.
function ArticleCard({ article }: { article: Article }) {
  const [hover, setHover] = useState(false);
  const glow = dominantEmotionColor(article.emotion_tags);

  return (
    <Link
      href={`/articles/${article.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block bg-white rounded-card overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
      style={{
        boxShadow: hover
          ? `0 18px 50px -12px ${glow}66, 0 4px 14px -6px ${glow}44`
          : `0 12px 40px -12px rgba(26,26,26,0.14)`,
      }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: glow, opacity: 0.85 }} />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            {article.emotion_tags.map((tag) => {
              const c = emotionColor(tag);
              return (
                <span key={tag}
                  className="font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${c}22`, color: c }}>
                  {tag}
                </span>
              );
            })}
          </div>
          <span className="font-display font-bold text-sm leading-none shrink-0 text-ink/70 ml-2">
            YWH
          </span>
        </div>
        <h3 className="font-display text-lg mb-2">{article.title}</h3>
        <p className="font-body text-sm text-ink/70 leading-relaxed mb-4">{article.excerpt}</p>
        <div className="flex items-center justify-between pt-3 border-t border-ink/10 mt-auto">
          <span className="font-body text-sm text-ink/60">Read →</span>
          <span className="font-mono text-xs text-ink/40">
            {article.is_anonymous || !article.author_name ? "Anonymous" : `By ${article.author_name}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const PAGE_SIZE = 24;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // DB-side paginated fetch: search, filter and sort run in Supabase so the
  // whole table is never downloaded -- scales to thousands of articles.
  const fetchPage = useCallback(
    async (pageIndex: number, replace: boolean) => {
      const supabase = createClient();
      let q = supabase
        .from("articles")
        .select("id, slug, title, excerpt, body, emotion_tags, is_anonymous, author_name, submitted_at",
          { count: pageIndex === 0 ? "exact" : undefined })
        .eq("status", "approved");

      if (emotionFilter !== "all") q = q.contains("emotion_tags", [emotionFilter]);
      if (debouncedQuery.trim()) {
        const term = `%${debouncedQuery.trim()}%`;
        q = q.or(`title.ilike.${term},excerpt.ilike.${term},body.ilike.${term}`);
      }
      if (sort === "named") q = q.eq("is_anonymous", false);
      else if (sort === "anonymous") q = q.eq("is_anonymous", true);
      q = q.order("submitted_at", { ascending: sort === "oldest" });

      const from = pageIndex * PAGE_SIZE;
      const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
      const rows = (data ?? []) as Article[];
      setArticles((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      if (pageIndex === 0 && typeof count === "number") setTotal(count);
    },
    [emotionFilter, debouncedQuery, sort]
  );

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

  // Emotion filter options: the presets (DB filtering handles the actual match).

  const visible = articles;

  const activeFilters = query || emotionFilter !== "all" || sort !== "newest";

  return (
    <section className="px-6 md:px-16 py-16 max-w-4xl mx-auto relative">
      <PaintSplash color="marigold" className="absolute -top-8 -right-10 w-32 h-32 opacity-40 -z-10" />
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
        Reflections &amp; coping
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-4">
        Ways to think about what you&apos;re going through
      </h1>
      <p className="font-body text-ink/70 mb-8 max-w-xl">
        Short pieces to sit with, not solve everything. Written to comfort and guide,
        not to replace what a real conversation or professional support can offer.
      </p>

      <Link href="/articles/submit"
        className="inline-block mb-10 font-mono text-xs uppercase tracking-wide bg-ink text-white px-5 py-3 rounded-full hover:bg-ember transition">
        Write something to lift a heart →
      </Link>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reflections — a word, a feeling, a theme..."
          className="w-full border border-ink/20 rounded-full px-5 py-3 font-body focus:border-ember outline-none"
        />
      </div>

      {/* Filter + sort */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <label className="font-mono text-xs uppercase tracking-wide text-ink/50">Filter</label>
        <select
          value={emotionFilter}
          onChange={(e) => setEmotionFilter(e.target.value)}
          className="border border-ink/20 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wide focus:border-ember outline-none"
        >
          <option value="all">All feelings</option>
          {emotions.map((em) => (
            <option key={em.id} value={em.id}>{em.name}</option>
          ))}
        </select>

        <label className="font-mono text-xs uppercase tracking-wide text-ink/50 ml-2">Sort</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="border border-ink/20 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wide focus:border-ember outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="named">Named authors</option>
          <option value="anonymous">Anonymous</option>
        </select>

        {activeFilters && (
          <button
            onClick={() => { setQuery(""); setEmotionFilter("all"); setSort("newest"); }}
            className="font-mono text-xs uppercase tracking-wide text-ember hover:text-ink transition"
          >
            Clear
          </button>
        )}
        {total !== null && (
          <span className="font-mono text-xs text-ink/40 ml-auto">
            {total} {total === 1 ? "reflection" : "reflections"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="font-body text-ink/50">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="font-body text-ink/60">
          {total === 0 && !activeFilters ? (
            <>No reflections published yet. <Link href="/articles/submit" className="underline hover:text-ember">Be the first to write one.</Link></>
          ) : (
            "No reflections match your search yet."
          )}
        </p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {visible.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="font-body bg-ink text-white px-8 py-3 rounded-full hover:bg-ember transition disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more reflections"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
