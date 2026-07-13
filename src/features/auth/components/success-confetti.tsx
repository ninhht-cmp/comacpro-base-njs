'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

/**
 * One-shot fireworks for the signup-success moment: a big centre burst plus
 * two smaller echoes left/right, in the brand's warm golds. Renders nothing —
 * canvas-confetti draws on its own fixed full-screen canvas.
 *
 * Skipped entirely under `prefers-reduced-motion`.
 */
const COLORS = ['#e8734a', '#f59e0b', '#fbbf24', '#fde68a', '#ffffff'];

function burst(origin: { x: number; y: number }, scale: number) {
  // The canvas-confetti "realistic look" recipe: overlapping shots with
  // different spreads/velocities read as one firework, not a particle dump.
  const shot = (ratio: number, opts: confetti.Options) =>
    confetti({
      origin,
      colors: COLORS,
      particleCount: Math.floor(200 * scale * ratio),
      ...opts,
    });
  shot(0.25, { spread: 26, startVelocity: 55 });
  shot(0.2, { spread: 60 });
  shot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  shot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  shot(0.1, { spread: 120, startVelocity: 45 });
}

export function SuccessConfetti() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // StrictMode-safe by design: no `fired` ref (its early-return swallowed
    // the real celebration after the dev remount cycle) and no
    // `confetti.reset()` in cleanup (it wiped the in-flight burst before the
    // first frame painted — the "no fireworks after submit" bug). Particles
    // self-terminate in ~2s; cleanup only cancels not-yet-fired echoes. The
    // dev-only double initial burst is harmless.
    burst({ x: 0.5, y: 0.55 }, 1);
    const echoes = [
      setTimeout(() => burst({ x: 0.2, y: 0.4 }, 0.45), 350),
      setTimeout(() => burst({ x: 0.8, y: 0.4 }, 0.45), 650),
    ];
    return () => echoes.forEach(clearTimeout);
  }, []);

  return null;
}
