"use client";

import Link from "next/link";
import { useState } from "react";
import type { Story } from "@/lib/seed-stories";
import { dominantEmotionColor, emotionColor } from "@/lib/emotions";

export default function StoryCard({ story }: { story: Story }) {
  const [hover, setHover] = useState(false);
  const glow = dominantEmotionColor(story.emotionTags);

  return (
    <Link
      href={`/stories/${story.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block bg-white rounded-card overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        // Emotion-tied glow: a soft coloured shadow that intensifies on hover.
        boxShadow: hover
          ? `0 18px 50px -12px ${glow}66, 0 4px 14px -6px ${glow}44`
          : `0 12px 40px -12px rgba(26,26,26,0.14)`,
      }}
    >
      {/* A thin coloured accent strip at the top, tinted by the main emotion. */}
      <div className="h-1 w-full" style={{ backgroundColor: glow, opacity: 0.85 }} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            {story.emotionTags.map((tag) => {
              const c = emotionColor(tag);
              return (
                <span
                  key={tag}
                  className="font-mono text-xs uppercase tracking-wide px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${c}22`, color: c }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
          {/* Site mark, top right */}
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
