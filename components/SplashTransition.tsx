"use client";

import { useEffect, useState } from "react";

type SplashTransitionProps = {
  imageUrl: string;
  message: string;
  onComplete: () => void;
  durationMs?: number;
};

// A brief, skippable, emotionally-matched image bridges the gap between
// screens (e.g., check-in -> matched stories) instead of an abrupt jump.
export default function SplashTransition({
  imageUrl,
  message,
  onComplete,
  durationMs = 1400,
}: SplashTransitionProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cover bg-center cursor-pointer"
      style={{ backgroundImage: `url(${imageUrl})` }}
      onClick={() => {
        setVisible(false);
        onComplete();
      }}
      role="button"
      tabIndex={0}
      aria-label="Skip transition"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setVisible(false);
          onComplete();
        }
      }}
    >
      <div className="absolute inset-0 bg-ink/40" />
      <p className="relative font-display text-white text-2xl md:text-3xl text-center px-8 max-w-lg">
        {message}
      </p>
      <span className="absolute bottom-6 right-6 font-mono text-xs text-white/70">
        tap to skip
      </span>
    </div>
  );
}
