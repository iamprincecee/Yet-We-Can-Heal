"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PaintSplash from "@/components/PaintSplash";
import { createClient } from "@/lib/supabase/client";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  emotion_tags: string[];
  is_anonymous: boolean;
  author_name: string | null;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("articles")
        .select("id, slug, title, excerpt, emotion_tags, is_anonymous, author_name")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false });
      setArticles(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

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
        className="inline-block mb-12 font-mono text-xs uppercase tracking-wide bg-ink text-white px-5 py-3 rounded-full hover:bg-ember transition">
        Write something to lift a heart →
      </Link>

      {loading ? (
        <p className="font-body text-ink/50">Loading...</p>
      ) : articles.length === 0 ? (
        <p className="font-body text-ink/60">
          No reflections published yet.{" "}
          <Link href="/articles/submit" className="underline hover:text-ember">Be the first to write one.</Link>
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.slug}`}
              className="block bg-white rounded-card shadow-card p-6 hover:-translate-y-1 transition-transform duration-200">
              <div className="flex flex-wrap gap-2 mb-3">
                {article.emotion_tags.map((tag) => (
                  <span key={tag}
                    className="font-mono text-xs uppercase tracking-wide bg-blush text-ink/80 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-display text-lg mb-2">{article.title}</h3>
              <p className="font-body text-sm text-ink/70 leading-relaxed mb-3">{article.excerpt}</p>
              <p className="font-mono text-xs text-ink/40">
                {article.is_anonymous || !article.author_name ? "Anonymous" : `By ${article.author_name}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
