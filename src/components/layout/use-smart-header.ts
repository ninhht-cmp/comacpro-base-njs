'use client';

import { useEffect, useState } from 'react';

/** Within this many px of the top the header is always shown. */
const REVEAL_AT_TOP = 80;
/** Ignore scroll jitter smaller than this (trackpad/inertia noise). */
const DELTA = 6;

export interface SmartHeaderState {
  /** Hidden because the user is scrolling down mid-page. */
  hidden: boolean;
  /** Scrolled away from the very top — drives the blur/border/shadow. */
  scrolled: boolean;
}

/**
 * Smart sticky-header behavior: reveal on scroll up, hide on scroll down, and
 * always show near the top. Reads `window.scrollY` on a `requestAnimationFrame`
 * tick (passive listener) and only re-renders when the derived state changes.
 */
export function useSmartHeader(): SmartHeaderState {
  const [state, setState] = useState<SmartHeaderState>({
    hidden: false,
    scrolled: false,
  });

  useEffect(() => {
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;

    const evaluate = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      const scrolled = y > 4;

      if (y <= REVEAL_AT_TOP) hidden = false;
      else if (y > lastY + DELTA)
        hidden = true; // scrolling down
      else if (y < lastY - DELTA) hidden = false; // scrolling up
      lastY = y;

      setState((prev) =>
        prev.hidden === hidden && prev.scrolled === scrolled
          ? prev
          : { hidden, scrolled },
      );
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    };

    evaluate(); // sync to a restored scroll position on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return state;
}
