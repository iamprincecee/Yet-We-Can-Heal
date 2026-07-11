export type Emotion = {
  id: string;
  name: string;
  accent: "ember" | "tidewater" | "marigold" | "plum" | "skyburst";
  // Search term used to pull an emotionally-matched photo for this feeling's results page
  imageQuery: string;
};

export const emotions: Emotion[] = [
  { id: "heartbroken", name: "Heartbroken", accent: "ember", imageQuery: "rain window quiet" },
  { id: "lonely", name: "Lonely", accent: "skyburst", imageQuery: "empty road dusk" },
  { id: "angry", name: "Angry", accent: "ember", imageQuery: "storm clouds" },
  { id: "ashamed", name: "Ashamed", accent: "plum", imageQuery: "quiet forest fog" },
  { id: "numb", name: "Numb", accent: "tidewater", imageQuery: "still lake grey sky" },
  { id: "afraid", name: "Afraid", accent: "plum", imageQuery: "dark path light ahead" },
  { id: "hopeless", name: "Hopeless", accent: "skyburst", imageQuery: "overcast horizon" },
  { id: "hopeful", name: "Hopeful", accent: "marigold", imageQuery: "sunrise open field" },
];

// A distinct colour for each preset emotion, used for the chip accent and the
// card's emotion-tied glow. Custom (user-entered) emotions aren't in this map,
// so they fall back to a neutral monochrome grey — which also visually signals
// "this tag is unofficial".
const EMOTION_COLORS: Record<string, string> = {
  heartbroken: "#FF4D3D", // ember red
  lonely: "#2E6BE6",      // skyburst blue
  angry: "#E8552D",       // burnt orange
  ashamed: "#6A2C70",     // plum
  numb: "#5B7B8A",        // muted slate
  afraid: "#7A4FB5",      // violet
  hopeless: "#3A5A78",    // deep steel blue
  hopeful: "#F4B400",     // marigold
};

const MONOCHROME = "#8A8A8A";

// Returns the hex colour for an emotion id — a distinct colour for presets,
// neutral grey for anything custom/unknown.
export function emotionColor(id: string): string {
  return EMOTION_COLORS[id.toLowerCase()] ?? MONOCHROME;
}

// The "dominant" emotion of a piece = its first tag, used to tint the glow.
export function dominantEmotionColor(tags: string[]): string {
  if (!tags || tags.length === 0) return MONOCHROME;
  return emotionColor(tags[0]);
}

export function getEmotion(id: string): Emotion | undefined {
  return emotions.find((e) => e.id === id);
}
