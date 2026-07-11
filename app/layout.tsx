import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import VisitorTracker from "@/components/VisitorTracker";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Yet, We Can Heal",
  description: "One heart at a time. Anonymous stories of survival and healing.",
};

// Without this, mobile browsers render the page at a fake desktop width and
// scale it down -- making the whole site look tiny and zoomed out, and
// preventing the responsive breakpoints from ever kicking in.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ywh-theme');var d=t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} font-body antialiased`}
      >
        <SiteHeader />
        <VisitorTracker />
        <main>{children}</main>
        <footer className="mt-24 border-t border-ink/10 bg-paper">
          {/* Crisis line first and prominent — for a platform like this, the
              most important thing in the footer is the fastest path to help. */}
          <div className="section-invert bg-ink text-white px-6 md:px-16 py-5 text-center">
            <p className="font-body text-sm">
              In crisis or thinking about harming yourself?{" "}
              <Link href="/crisis-resources" className="font-medium underline underline-offset-4 hover:text-ember transition">
                Find immediate help here
              </Link>
              . You matter, and support is available right now.
            </p>
          </div>

          <div className="px-6 md:px-16 py-14 grid gap-10 md:grid-cols-4 max-w-6xl mx-auto">
            {/* Brand + mission */}
            <div className="md:col-span-1">
              <p className="font-display font-700 text-2xl mb-2">Yet, We Can Heal</p>
              <p className="font-body text-sm text-ink/60 leading-relaxed">
                A home for anonymous stories of survival — built on one
                belief: if they healed, so can you.
              </p>
            </div>

            {/* Explore */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-4">Explore</p>
              <ul className="space-y-2.5 font-body text-sm">
                <li><Link href="/stories" className="text-ink/70 hover:text-ember transition">Read stories</Link></li>
                <li><Link href="/articles" className="text-ink/70 hover:text-ember transition">Reflections</Link></li>
                <li><Link href="/stories/submit" className="text-ink/70 hover:text-ember transition">Share your story</Link></li>
                <li><Link href="/check-in" className="text-ink/70 hover:text-ember transition">How are you feeling?</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-4">Support</p>
              <ul className="space-y-2.5 font-body text-sm">
                <li><Link href="/crisis-resources" className="text-ink/70 hover:text-ember transition">Crisis resources</Link></li>
                <li><Link href="/community" className="text-ink/70 hover:text-ember transition">Community</Link></li>
                <li><Link href="/community-guidelines" className="text-ink/70 hover:text-ember transition">Guidelines</Link></li>
                <li><Link href="/volunteer" className="text-ink/70 hover:text-ember transition">Volunteer</Link></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-4">About</p>
              <ul className="space-y-2.5 font-body text-sm">
                <li><Link href="/about" className="text-ink/70 hover:text-ember transition">Our story</Link></li>
                <li><Link href="/about#contact" className="text-ink/70 hover:text-ember transition">Contact us</Link></li>
                <li><Link href="/admin/login" className="text-ink/70 hover:text-ember transition">Team login</Link></li>
              </ul>
            </div>
          </div>

          <div className="px-6 md:px-16 py-6 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl mx-auto">
            <p className="font-body text-xs text-ink/50">
              © {new Date().getFullYear()} Yet, We Can Heal. Not a substitute for professional care.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
              You are not alone in this.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
