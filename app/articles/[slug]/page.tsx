"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PaintSplash from "@/components/PaintSplash";
import ShareButton from "@/components/ShareButton";
import ReportButton from "@/components/ReportButton";
import FeedbackNote from "@/components/FeedbackNote";
import { createClient } from "@/lib/supabase/client";
import { emotionColor, dominantEmotionColor } from "@/lib/emotions";

type Article = {
  id: string;
  title: string;
  body: string;
  emotion_tags: string[];
  is_anonymous: boolean;
  author_name: string | null;
  author_link: string | null;
  image_url: string | null;
  trigger_warning: string | null;
};

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("articles")
        .select("id, title, body, emotion_tags, is_anonymous, author_name, author_link, image_url, trigger_warning")
        .eq("slug", slug)
        .eq("status", "approved")
        .single();
      setArticle(data);
      setRevealed(!data?.trigger_warning);
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

  const accent = dominantEmotionColor(article.emotion_tags);

  return (
    <>
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
    <article className="px-6 md:px-16 py-16 max-w-2xl mx-auto relative">
      <PaintSplash color="marigold" className="absolute -top-8 -left-12 w-28 h-28 opacity-40 -z-10" />

      <Link href="/articles" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
        ← Back to articles
      </Link>

      <div className="flex flex-wrap gap-2 my-6">
        {article.emotion_tags.map((tag) => {
          const c = emotionColor(tag);
          return (
            <span key={tag} className="font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full"
              style={{ backgroundColor: `${c}22`, color: c }}>
              {tag}
            </span>
          );
        })}
      </div>

      {article.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image_url}
          alt=""
          className="w-full h-56 md:h-72 object-cover rounded-card mb-6"
        />
      )}
      <h1 className="font-display text-3xl md:text-4xl mb-2">{article.title}</h1>

      {/* Byline */}
      <p className="font-mono text-xs text-ink/50 mb-6">
        {article.is_anonymous || !article.author_name ? "Written anonymously" : `By ${article.author_name}`}
      </p>

      {!revealed ? (
        <div className="bg-blush/60 rounded-card p-8 text-center mb-10">
          <p className="font-body text-ink/80 mb-4">
            <strong>Sensitivity warning:</strong> {article.trigger_warning}
          </p>
          <button
            onClick={() => setRevealed(true)}
            className="font-body bg-ink text-white px-6 py-3 rounded-full hover:bg-ember transition"
          >
            I&apos;m ready to read this
          </button>
        </div>
      ) : (
        <div className="font-body text-lg leading-relaxed text-ink/90 whitespace-pre-line mb-10">
          {article.body}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
        <button
          onClick={() => setMarkedHelpful(true)}
          disabled={markedHelpful}
          className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ember hover:text-ember transition disabled:opacity-60"
        >
          {markedHelpful ? "This helped 🧡" : "Was this helpful?"}
        </button>
        <ShareButton
          title={article.title}
          text="A reflection from Yet, We Can Heal"
          path={`/articles/${slug}`}
        />
        <Link href="/articles/submit" className="font-body text-sm px-5 py-2 rounded-full bg-ember text-white hover:brightness-110 transition ml-auto">
          Write something too
        </Link>
      </div>
      {markedHelpful && <FeedbackNote contentType="article" contentId={article.id} />}
      <div className="mt-4 text-center">
        <ReportButton contentType="article" contentId={article.id} />
      </div>
    </article>
    </>
  );
}
