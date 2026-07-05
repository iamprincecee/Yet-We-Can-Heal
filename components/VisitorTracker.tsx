"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Assigns each visitor a session id (kept for the browser session only) and
// sends periodic "heartbeats" WHILE THE SITE'S TAB IS THE VISIBLE/ACTIVE TAB.
// If the visitor leaves this tab open and in front of them, it counts as time
// on the site -- even if they're sitting still reading (a deeply engaged reader
// may not move the mouse at all). Time stops counting only when they switch to
// another tab or minimize the window. Admin pages are excluded.

const HEARTBEAT_MS = 15000; // send a heartbeat every 15s while the tab is visible

function getSessionId(): string {
  const KEY = "ywh_session_id";
  // sessionStorage: a new id per browser tab-session, cleared when the tab
  // closes -- exactly the granularity we want for "a visit".
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();

    function beat() {
      // Count time whenever this tab is the visible/active one.
      if (document.visibilityState !== "visible") return;
      fetch("/api/metrics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
    }

    // Fire one immediately (records the visit + session start), then on a timer.
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);

    // Beat again the moment the tab becomes visible after being hidden, so the
    // gap while they were away isn't counted but their return is captured.
    function onVisible() {
      if (document.visibilityState === "visible") beat();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
