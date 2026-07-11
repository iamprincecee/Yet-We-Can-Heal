"use client";

import { useEffect, useState } from "react";

// A set of 2-line messages, all on-vision: survival, shared strength, hope.
// They fade from one to the next every few seconds.
const MESSAGES: [string, string][] = [
  ["Someone else survived what you're going through.", "You can too."],
  ["Find strength in stories like yours.", "You were never the only one."],
  ["Your wounds are proof you fought —", "and proof you're still here."],
  ["You are stronger than you know.", "One story at a time."],
  ["They healed.", "So can you."],
];

const INTERVAL_MS = 5000;

export default function RotatingHeadline() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      // fade out, swap, fade in
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 600);
      return () => clearTimeout(swap);
    }, INTERVAL_MS);
    return () => clearInterval(tick);
  }, []);

  const [line1, line2] = MESSAGES[index];

  return (
    <h1
      className="font-display font-700 text-4xl md:text-6xl text-white leading-[1.05] mb-7 min-h-[2.2em] transition-opacity duration-600"
      style={{ opacity: visible ? 1 : 0, transitionDuration: "600ms" }}
      aria-live="polite"
    >
      {line1}
      <br />
      {line2}
    </h1>
  );
}
