"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emotions } from "@/lib/emotions";
import SplashTransition from "@/components/SplashTransition";
import PaintSplash from "@/components/PaintSplash";

const accentClasses: Record<string, string> = {
  ember: "bg-ember/10 border-ember text-ember hover:bg-ember hover:text-white",
  tidewater: "bg-tidewater/10 border-tidewater text-tidewater hover:bg-tidewater hover:text-white",
  marigold: "bg-marigold/10 border-marigold text-marigold hover:bg-marigold hover:text-white",
  plum: "bg-plum/10 border-plum text-plum hover:bg-plum hover:text-white",
  skyburst: "bg-skyburst/10 border-skyburst text-skyburst hover:bg-skyburst hover:text-white",
};

export default function CheckInPage() {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState<string | null>(null);

  function handleSelect(emotionId: string) {
    fetch("/api/emotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion: emotionId }),
    }).catch(() => {
      // Non-critical -- if this fails, the check-in flow still works fine
      // for the visitor. It just won't count toward the metrics dashboard.
    });
    setTransitioning(emotionId);
  }

  if (transitioning) {
    const emotion = emotions.find((e) => e.id === transitioning);
    return (
      <SplashTransition
        imageUrl={`https://source.unsplash.com/1600x900/?${encodeURIComponent(
          emotion?.imageQuery ?? "quiet"
        )}`}
        message={`Finding stories for feeling ${emotion?.name.toLowerCase()}...`}
        onComplete={() => router.push(`/stories?feeling=${transitioning}`)}
      />
    );
  }

  return (
    <section className="px-6 md:px-16 py-20 max-w-3xl mx-auto text-center relative min-h-[70vh] flex flex-col items-center justify-center">
      <PaintSplash
        color="skyburst"
        className="absolute -top-6 -right-10 w-36 h-36 opacity-50 -z-10"
      />
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
        Take a breath
      </p>
      <h1 className="font-display text-3xl md:text-4xl mb-10">
        How are you feeling right now?
      </h1>
      <div className="flex flex-wrap gap-3 justify-center">
        {emotions.map((emotion) => (
          <button
            key={emotion.id}
            onClick={() => handleSelect(emotion.id)}
            className={`font-body border-2 rounded-full px-6 py-3 text-base transition-colors ${accentClasses[emotion.accent]}`}
          >
            {emotion.name}
          </button>
        ))}
      </div>
      <p className="mt-10 text-sm text-ink/50 font-body">
        There&apos;s no wrong answer. You can change your mind anytime.
      </p>
    </section>
  );
}
