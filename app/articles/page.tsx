import Link from "next/link";
import PaintSplash from "@/components/PaintSplash";
import { seedArticles } from "@/lib/seed-articles";

export default function ArticlesPage() {
  return (
    <section className="px-6 md:px-16 py-16 max-w-4xl mx-auto relative">
      <PaintSplash color="marigold" className="absolute -top-8 -right-10 w-32 h-32 opacity-40 -z-10" />
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
        Reflections &amp; coping
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-4">
        Ways to think about what you&apos;re going through
      </h1>
      <p className="font-body text-ink/70 mb-12 max-w-xl">
        Short pieces to sit with, not solve everything. Written to comfort and guide,
        not to replace what a real conversation or professional support can offer.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {seedArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="block bg-white rounded-card shadow-card p-6 hover:-translate-y-1 transition-transform duration-200"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {article.emotionTags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs uppercase tracking-wide bg-blush text-ink/80 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="font-display text-lg mb-2">{article.title}</h3>
            <p className="font-body text-sm text-ink/70 leading-relaxed">{article.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
