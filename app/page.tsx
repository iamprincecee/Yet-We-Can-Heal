import Link from "next/link";
import PaintSplash from "@/components/PaintSplash";
import StoryPreviews from "@/components/StoryPreviews";

export default function LandingPage() {
  return (
    <>
      {/* Hero — the landing page gets the most curated, emotionally-matched
          photography on the site, since this is the moment someone decides
          whether to stay. */}
      <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500817487388-039e623edc21?q=80&w=2000&auto=format&fit=crop"
          alt="A quiet sunrise over open water, horizon glowing"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/10" />
        <div className="relative z-10 h-full flex flex-col items-start justify-end px-6 md:px-16 pb-16 md:pb-24 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-white/80 mb-4">
            One heart at a time
          </p>
          <h1 className="font-display font-700 text-4xl md:text-6xl text-white leading-[1.05] mb-6">
            If this person can heal,
            <br />
            then I can heal too.
          </h1>
          <p className="font-body text-white/90 text-lg mb-8 max-w-xl">
            A quiet space for anonymous stories of survival — for anyone who
            has been hurt by life and isn&apos;t ready to feel alone in it.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/check-in"
              className="font-body bg-ember text-white px-6 py-3 rounded-full font-medium hover:brightness-110 transition"
            >
              How am I feeling? →
            </Link>
            <Link
              href="/stories/submit"
              className="font-body bg-white/10 border border-white/40 text-white px-6 py-3 rounded-full font-medium hover:bg-white/20 transition backdrop-blur"
            >
              Share my story
            </Link>
          </div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="px-6 md:px-16 py-20 max-w-3xl mx-auto text-center relative">
        <PaintSplash
          color="marigold"
          className="absolute -top-10 -left-10 w-32 h-32 opacity-70 -z-10"
        />
        <p className="font-display text-2xl md:text-3xl leading-snug text-ink">
          This isn&apos;t therapy, and it doesn&apos;t claim to be. It&apos;s a
          companion — stories from people who felt exactly what you feel now,
          and found their way through it.
        </p>
      </section>

      {/* Story previews */}
      <StoryPreviews />

      {/* Closing CTA */}
      <section className="px-6 md:px-16 py-20 bg-ink text-white text-center relative overflow-hidden">
        <PaintSplash
          color="plum"
          className="absolute -bottom-16 -left-16 w-56 h-56 opacity-40 -z-0"
        />
        <h2 className="font-display text-3xl md:text-4xl mb-4 relative z-10">
          You don&apos;t have to heal alone.
        </h2>
        <Link
          href="/check-in"
          className="relative z-10 inline-block mt-4 font-body bg-ember text-white px-8 py-4 rounded-full font-medium hover:brightness-110 transition"
        >
          Start with how you&apos;re feeling
        </Link>
      </section>
    </>
  );
}
