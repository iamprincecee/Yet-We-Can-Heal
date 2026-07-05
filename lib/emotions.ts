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

export function getEmotion(id: string): Emotion | undefined {
  return emotions.find((e) => e.id === id);
}
