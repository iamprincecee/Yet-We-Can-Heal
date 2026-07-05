import Link from "next/link";
import type { Story } from "@/lib/seed-stories";

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.id}`}
      className="block bg-white rounded-card shadow-card overflow-hidden hover:-translate-y-1 transition-transform duration-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            {story.emotionTags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs uppercase tracking-wide bg-blush text-ink/80 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          {/* Site mark, top right -- just the initials per feedback */}
          <span className="font-display font-bold text-sm leading-none shrink-0 text-ink/70">
            YWH
          </span>
        </div>

        {story.title && (
          <h3 className="font-display text-xl mb-2">{story.title}</h3>
        )}
        <p className="font-body text-ink/80 leading-relaxed mb-4">
          {story.excerpt}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-ink/10">
          <span className="font-body text-sm text-ink/60">Read story →</span>
          <span className="font-mono text-xs text-ink/40">{story.readCount} reads</span>
        </div>
      </div>
    </Link>
  );
}
