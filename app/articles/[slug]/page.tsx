import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/seed-articles";
import PaintSplash from "@/components/PaintSplash";

export default function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) return notFound();

  return (
    <article className="px-6 md:px-16 py-16 max-w-2xl mx-auto relative">
      <PaintSplash color="marigold" className="absolute -top-8 -left-12 w-28 h-28 opacity-40 -z-10" />

      <Link href="/articles" className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ember">
        ← Back to articles
      </Link>

      <div className="flex flex-wrap gap-2 my-6">
        {article.emotionTags.map((tag) => (
          <span key={tag} className="font-mono text-xs uppercase tracking-wide bg-blush text-ink/80 px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="font-display text-3xl md:text-4xl mb-6">{article.title}</h1>
      <div className="font-body text-lg leading-relaxed text-ink/90 whitespace-pre-line mb-10">
        {article.body}
      </div>

      <div className="flex items-center justify-between border-t border-ink/10 pt-6">
        <Link href="/stories" className="font-body text-sm px-5 py-2 rounded-full border border-ink/20 hover:border-ember hover:text-ember transition">
          Read healing stories
        </Link>
        <Link href="/stories/submit" className="font-body text-sm px-5 py-2 rounded-full bg-ember text-white hover:brightness-110 transition">
          Share your own story
        </Link>
      </div>
    </article>
  );
}
