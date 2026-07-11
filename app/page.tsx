import Link from "next/link";
import PaintSplash from "@/components/PaintSplash";
import StoryPreviews from "@/components/StoryPreviews";
import RotatingHeadline from "@/components/RotatingHeadline";

export default function LandingPage() {
  return (
    <>
      {/* Hero — the first breath. Full-bleed image, generous negative space,
          the promise stated plainly. This is where someone decides to stay. */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500817487388-039e623edc21?q=80&w=2000&auto=format&fit=crop"
          alt="A quiet sunrise over open water, horizon glowing"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        <div className="relative z-10 h-full flex flex-col items-start justify-end px-6 md:px-16 pb-20 md:pb-28 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/70 mb-5">
            One heart at a time
          </p>
          <RotatingHeadline />
          <p className="font-body text-white/90 text-lg md:text-xl leading-relaxed mb-9 max-w-xl">
            Real, anonymous stories from people who have been where you are —
            and found a way through. Read one. You might recognise yourself in it.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/check-in"
              className="font-body bg-ember text-white px-7 py-3.5 rounded-full font-medium hover:brightness-110 transition"
            >
              Start with how you feel →
            </Link>
            <Link
              href="/stories"
              className="font-body bg-white/10 border border-white/40 text-white px-7 py-3.5 rounded-full font-medium hover:bg-white/20 transition backdrop-blur"
            >
              Read the stories
            </Link>
          </div>
        </div>
      </section>

      {/* Mission — set apart with wide breathing room above, tighter below,
          so it lands like a held thought rather than just another band. */}
      <section className="px-6 md:px-16 pt-28 pb-16 max-w-2xl mx-auto text-center relative">
        <PaintSplash
          color="marigold"
          className="absolute top-6 -left-10 w-28 h-28 opacity-60 -z-10"
        />
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/40 mb-6">
          What this is
        </p>
        <p className="font-display text-2xl md:text-[2rem] leading-[1.35] text-ink">
          Not therapy. Not advice. Just the plain proof that you are not the
          first to feel this — and not the only one who made it to the other side.
        </p>
      </section>

      {/* A thin, human divider line of meaning instead of empty space. */}
      <section className="px-6 md:px-16 pb-24 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-display text-4xl text-ember mb-2">Read</p>
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              Find a story from someone who felt the way you do right now.
            </p>
          </div>
          <div>
            <p className="font-display text-4xl text-tidewater mb-2">Reflect</p>
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              Take a moment with it. Let someone else&apos;s words meet you where you are.
            </p>
          </div>
          <div>
            <p className="font-display text-4xl text-plum mb-2">Share</p>
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              When you&apos;re ready — if you ever are — your story might be the one someone else needs.
            </p>
          </div>
        </div>
      </section>

      {/* Story previews (only render when real stories exist). */}
      <StoryPreviews />

      {/* Closing CTA — full-bleed dark, more vertical weight than the mid-page
          sections so it reads as an arrival, not a repeat. */}
      <section className="section-invert px-6 md:px-16 py-28 bg-ink text-white text-center relative overflow-hidden">
        <PaintSplash
          color="plum"
          className="absolute -bottom-20 -left-16 w-64 h-64 opacity-40 -z-0"
        />
        <PaintSplash
          color="tidewater"
          className="absolute -top-16 -right-12 w-48 h-48 opacity-30 -z-0"
        />
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50 mb-5 relative z-10">
          Whenever you&apos;re ready
        </p>
        <h2 className="font-display text-3xl md:text-5xl leading-tight mb-8 relative z-10 max-w-2xl mx-auto">
          You don&apos;t have to carry it alone anymore.
        </h2>
        <Link
          href="/check-in"
          className="relative z-10 inline-block font-body bg-ember text-white px-9 py-4 rounded-full font-medium hover:brightness-110 transition"
        >
          Start with how you&apos;re feeling
        </Link>
      </section>
    </>
  );
}
