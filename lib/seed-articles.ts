export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  emotionTags: string[];
};

export const seedArticles: Article[] = [
  {
    slug: "why-healing-feels-slow",
    title: "Why healing feels slow",
    excerpt: "It's not you doing it wrong. Healing was never supposed to move in a straight line.",
    body: "There's an idea that healing should feel like progress — steady, visible, upward. In reality, it's closer to weather. Some days are clear. Some days a storm you thought had passed circles back.\n\nThis doesn't mean you're failing. It means you're human, moving through something that doesn't have a fixed timeline. Slow isn't the same as stuck.",
    emotionTags: ["hopeless", "numb"],
  },
  {
    slug: "coping-with-emotional-pain",
    title: "Coping with emotional pain",
    excerpt: "A few small, ordinary ways to get through the heaviest days.",
    body: "You don't need a perfect coping strategy — you need a handful of small, ordinary things you can reach for when it gets heavy. Naming the feeling out loud, even just to yourself. Stepping outside for five minutes. Reaching out to one person, even with a short message.\n\nNone of these fix the pain. They just help you carry it a little longer, until it feels lighter on its own.",
    emotionTags: ["heartbroken", "angry"],
  },
  {
    slug: "learning-to-trust-again",
    title: "Learning to trust again",
    excerpt: "Trust doesn't return all at once. It returns in small, testable doses.",
    body: "After being hurt, trust can feel like a switch that got broken — all or nothing. But trust actually rebuilds in small, testable doses: someone keeps a small promise, and something in you loosens slightly. It happens slower than you'd like, and that's normal.\n\nYou're allowed to trust cautiously. Caution isn't the opposite of healing — it's often part of it.",
    emotionTags: ["afraid", "ashamed"],
  },
  {
    slug: "healing-after-betrayal",
    title: "Healing after betrayal",
    excerpt: "Betrayal doesn't just hurt — it rewrites what you thought you knew.",
    body: "Betrayal has a particular sting because it doesn't just hurt in the moment — it makes you question things you thought were solid. Healing here often means grieving the version of events you believed in, not just the relationship or person.\n\nGive yourself permission to mourn that, too.",
    emotionTags: ["angry", "afraid"],
  },
  {
    slug: "managing-loneliness",
    title: "Managing loneliness",
    excerpt: "Loneliness lies. It tells you you're the only one who feels this way.",
    body: "Loneliness has a way of convincing you that you're uniquely alone in what you're feeling — that everyone else has it figured out. That's rarely true. It's just that most people don't say it out loud.\n\nIf you're reading this, you're already doing something about it: looking for something that says you're not the only one.",
    emotionTags: ["lonely", "numb"],
  },
];

export function getArticle(slug: string): Article | undefined {
  return seedArticles.find((a) => a.slug === slug);
}

export function articlesForEmotion(emotionId: string): Article[] {
  return seedArticles.filter((a) => a.emotionTags.includes(emotionId));
}
