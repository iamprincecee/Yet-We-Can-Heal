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
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} font-body antialiased`}
      >
        <SiteHeader />
        <VisitorTracker />
        <main>{children}</main>
        <footer className="px-6 md:px-12 py-10 border-t border-ink/5 mt-20 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink/60">
          <p>© {new Date().getFullYear()} Yet, We Can Heal. Not a substitute for professional care.</p>
          <div className="flex gap-6 font-mono text-xs uppercase tracking-wide">
            <Link href="/crisis-resources" className="hover:text-ember">Crisis Resources</Link>
            <Link href="/community-guidelines" className="hover:text-ember">Guidelines</Link>
            <Link href="/volunteer" className="hover:text-ember">Volunteer</Link>
            <Link href="/about" className="hover:text-ember">About</Link>
            <Link href="/admin/login" className="hover:text-ember">Team Login</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
