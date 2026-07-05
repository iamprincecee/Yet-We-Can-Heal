"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PaintSplash from "@/components/PaintSplash";
import { createClient } from "@/lib/supabase/client";

type Article = {
  title: string;
  body: string;
  emotion_tags: string[];
  is_anonymous: boolean;
  author_name: string | null;
  author_link: string | null;
};

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("articles")
        .select("title, body, emotion_tags, is_anonymous, author_name, author_link")
        .eq("slug", slug)
        .eq("status", "approved")
        .single();
      setArticle(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return <section className="px-6 py-24 max-w-2xl mx-auto"><p className="font-body text-ink/50">Loading...</p></section>;
  }
  if (!article) {
    return (
      <section className="px-6 py-24 max-w-2xl mx-auto text-center">
        <h1 className="font-display text-2xl mb-4">Article not found</h1>
        <Link href="/articles" className="font-body underline hover:text-ember">Back to articles</Link>
      </section>
    );
  }

  return (
    <article className="px-6 md:px-16 py-16 max-w-2xl mx-auto relative">
      <PaintSplash color="marigold" className="absolute -top-8 -left-12 w-28 h-28 opacity-40 -z-10" />

      <Link href="/articles" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
        ← Back to articles
      </Link>

      <div className="flex flex-wrap gap-2 my-6">
        {article.emotion_tags.map((tag) => (
          <span key={tag} className="font-mono text-xs uppercase tracking-wide bg-blush text-ink/80 px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="font-display text-3xl md:text-4xl mb-2">{article.title}</h1>

      {/* Byline */}
      <p className="font-mono text-xs text-ink/50 mb-6">
        {article.is_anonymous || !article.author_name ? (
          "Written anonymously"
        ) : (
          <>
            By {article.author_name}
            {article.author_link && (
              <>
                {" · "}
                <a href={article.author_link} target="_blank" rel="noopener noreferrer nofollow"
                  className="underline hover:text-ember">
                  {article.author_link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </>
            )}
          </>
        )}
      </p>

      <div className="font-body text-lg leading-relaxed text-ink/90 whitespace-pre-line mb-10">
        {article.body}
      </div>

      <div className="flex items-center justify-between border-t border-ink/10 pt-6">
        <Link href="/stories" className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ember hover:text-ember transition">
          Read healing stories
        </Link>
        <Link href="/articles/submit" className="font-body text-sm px-5 py-2 rounded-full bg-ember text-white hover:brightness-110 transition">
          Write something too
        </Link>
      </div>
    </article>
  );
}
