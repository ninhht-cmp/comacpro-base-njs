'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Honor medals — the referrer's achievements (experience / rating / revenue)
 * as a scroll-snap carousel: all three fit on wide screens (dots hide), small
 * screens swipe with dot pagination.
 *
 * TODO(product): the medal artwork is static (`public/assets/1`) — same
 * numbers for every referrer. Swap to per-referrer data once the backend
 * exposes achievements.
 */
const MEDALS = [
  { key: 'experience', src: '/assets/1/experience.svg' },
  { key: 'reviews', src: '/assets/1/reviews.svg' },
  { key: 'revenue', src: '/assets/1/revenue.svg' },
] as const;

export function HonorCarousel() {
  const t = useTranslations('Auth.signup.honor');
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const scrollable = track.scrollWidth - track.clientWidth;
      setOverflowing(scrollable > 1);
      if (scrollable > 1) {
        setActive(
          Math.round((track.scrollLeft / scrollable) * (MEDALS.length - 1)),
        );
      }
    };
    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section className="flex flex-col items-center gap-3">
      <div
        ref={trackRef}
        // `justify-center-safe`: centered when the medals fit, falls back to
        // start-aligned when they overflow — plain `justify-center` would clip
        // the first medal beyond the scrollable edge.
        className="flex w-full snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] justify-center-safe gap-4 overflow-x-auto px-4 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {MEDALS.map(({ key, src }) => (
          // Plain <img>: local SVGs gain nothing from next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={src}
            alt={t(key)}
            width={132}
            height={132}
            className="size-33 shrink-0 snap-center"
          />
        ))}
      </div>
      {overflowing ? (
        <div aria-hidden className="flex items-center gap-1.5">
          {MEDALS.map(({ key }, index) => (
            <span
              key={key}
              className={
                index === active
                  ? 'h-1.5 w-4 rounded-full bg-amber-500 transition-all'
                  : 'size-1.5 rounded-full bg-border transition-all'
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
