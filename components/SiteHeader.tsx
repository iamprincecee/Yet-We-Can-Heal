"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/stories", label: "Stories" },
  { href: "/articles", label: "Articles" },
  { href: "/stories/submit", label: "Share your story" },
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-ink/10">
      <div className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display font-700 text-3xl md:text-4xl leading-none tracking-tight">
            YWH
          </span>
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-ink/50">
            Yet, We Can Heal
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 font-body text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ember transition-colors">
              {link.label}
            </Link>
          ))}
          <Link
            href="/crisis-resources"
            className="font-mono text-xs uppercase tracking-wide bg-ink text-white px-3 py-2 rounded-full hover:bg-ember transition-colors"
          >
            Need help now
          </Link>
          <ThemeToggle />
        </nav>

        {/* Mobile controls: crisis link stays visible + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <Link
            href="/crisis-resources"
            className="font-mono text-[10px] uppercase tracking-wide bg-ink text-white px-3 py-2 rounded-full"
          >
            Need help now
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          >
            <span
              className={`block h-0.5 w-6 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span className={`block h-0.5 w-6 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-0.5 w-6 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav className="md:hidden border-t border-ink/5 bg-white px-6 py-4 flex flex-col gap-1 font-body">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-base border-b border-ink/5 last:border-b-0 hover:text-ember transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
