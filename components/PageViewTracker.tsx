"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires a page_view metric on every route change. Mounted once in the root
// layout so it covers the whole public site. Admin routes are skipped -- we
// only want to measure real visitor traffic, not the team's own dashboard use.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    // Fire and forget -- a failed metric should never disrupt the page.
    fetch("/api/metrics/page-view", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
