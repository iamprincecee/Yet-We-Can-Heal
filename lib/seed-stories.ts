export type Story = {
  id: string;
  title: string | null;
  excerpt: string;
  body: string;
  whatHelpedHeal: string;
  emotionTags: string[];
  triggerWarning: string | null;
  readCount: number;
  helpfulCount: number;
  imageUrl?: string | null;
};

export const seedStories: Story[] = [
  {
    id: "1",
    title: null,
    excerpt: "I thought the silence would last forever. It didn't.",
    body: "For two years I didn't tell anyone what happened. I carried it like a stone in my chest, certain that saying it out loud would make it more real, not less. I smiled at work. I laughed with friends. Underneath it, I was drowning quietly.\n\nWhat changed wasn't a single moment — it was a slow accumulation of small permissions I gave myself to feel what I felt, without rushing to fix it.",
    whatHelpedHeal: "Writing down what happened, even if no one ever read it. Seeing it on paper made it smaller than the version living in my head.",
    emotionTags: ["heartbroken", "numb"],
    triggerWarning: null,
    readCount: 482,
    helpfulCount: 96,
  },
  {
    id: "2",
    title: null,
    excerpt: "Anger kept me alive before it nearly ate me alive.",
    body: "I was angry for a long time — at the people who hurt me, at myself for staying, at the world for not noticing. That anger got me out of a bad situation. But it also kept me from letting anyone close for years afterward.\n\nHealing wasn't about getting rid of the anger. It was about learning it had done its job, and it was safe to set it down.",
    whatHelpedHeal: "A support group where nobody flinched when I said the ugly parts out loud.",
    emotionTags: ["angry", "afraid"],
    triggerWarning: "Mentions of abuse",
    readCount: 311,
    helpfulCount: 74,
  },
  {
    id: "3",
    title: null,
    excerpt: "Some mornings I still wake up surprised that I'm okay.",
    body: "There's no finish line to this. Some days healing looks like laughing until I cry with people who love me. Other days it looks like sitting very still until a wave passes. Both are part of it.\n\nWhat I know now that I didn't know then: needing time doesn't mean I'm broken.",
    whatHelpedHeal: "Letting go of the timeline I thought healing was supposed to follow.",
    emotionTags: ["hopeful", "lonely"],
    triggerWarning: null,
    readCount: 205,
    helpfulCount: 58,
  },
];

export function storiesForEmotion(emotionId: string): Story[] {
  return seedStories.filter((s) => s.emotionTags.includes(emotionId));
}

// A story matches if it shares ANY of the selected emotions -- someone may be
// feeling several things at once and shouldn't be limited to a single tag.
export function storiesForEmotions(emotionIds: string[]): Story[] {
  if (emotionIds.length === 0) return seedStories;
  return seedStories.filter((s) => s.emotionTags.some((tag) => emotionIds.includes(tag)));
}

export function searchStories(stories: Story[], query: string): Story[] {
  if (!query.trim()) return stories;
  const q = query.toLowerCase();
  return stories.filter(
    (s) =>
      s.excerpt.toLowerCase().includes(q) ||
      s.body.toLowerCase().includes(q) ||
      (s.title?.toLowerCase().includes(q) ?? false)
  );
}

// Search specifically against emotion tag names, since the reviewer wanted
// the search bar to search by emotion rather than free story text.
export function searchStoriesByEmotion(stories: Story[], query: string): Story[] {
  if (!query.trim()) return stories;
  const q = query.toLowerCase();
  return stories.filter((s) => s.emotionTags.some((tag) => tag.toLowerCase().includes(q)));
}
