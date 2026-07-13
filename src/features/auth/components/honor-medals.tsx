'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Honor medals — the referrer's achievements (experience / rating / revenue)
 * as a center-focus carousel: three medals visible, the one nearest the centre
 * scales up to full size while its neighbours shrink, and you drag/swipe (mouse
 * or touch, all screens) to bring another to the centre. It loops, so it's
 * always scrollable even though there are only three.
 *
 * The scale effect is measured from the DOM (each slide's distance to the
 * viewport centre) rather than embla's internals, so it survives version bumps
 * and works with `loop`. Runs on every 'scroll' tick → smooth during drag.
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

// Each medal rendered twice (6 slides at 1/3 width): at rest all three fit the
// viewport untrimmed, and embla's `loop` has enough slides to wrap seamlessly —
// with only 3 full-view slides the neighbours would centre ON the container
// edge and get clipped by `overflow-hidden`. Standard embla small-count trick.
const SLIDES = [...MEDALS, ...MEDALS];

// Side (off-centre) medals shrink to this fraction of the centred one. One knob
// for the whole podium contrast — bump it toward 1 to flatten the effect.
// (At rest the neighbours sit at 2/3 of the span → 1-(2/3)(1-MIN) of the hero:
// 0.7 ⇒ sides rest at 80%.)
const MIN_SCALE = 0.7;

type EmblaApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>;

export function HonorMedals() {
  const t = useTranslations('Auth.signup.honor');
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
  });
  const [selected, setSelected] = useState(0);

  const applyScale = useCallback((api: EmblaApi) => {
    const root = api.rootNode();
    const rootCentre = root.getBoundingClientRect().left + root.clientWidth / 2;
    // A slide reaches MIN_SCALE once its centre is half the viewport away.
    const span = root.clientWidth / 2;
    for (const node of api.slideNodes()) {
      const rect = node.getBoundingClientRect();
      const centre = rect.left + rect.width / 2;
      const dist = Math.min(Math.abs(centre - rootCentre) / span, 1);
      const scale = 1 - dist * (1 - MIN_SCALE);
      const medal = node.firstElementChild as HTMLElement | null;
      if (medal) medal.style.transform = `scale(${scale})`;
    }
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const onScroll = () => applyScale(emblaApi);
    const onReInit = () => {
      onSelect();
      onScroll();
    };
    onReInit();
    emblaApi.on('select', onSelect);
    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onReInit);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('reInit', onReInit);
    };
  }, [emblaApi, applyScale]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('reviews')}
      className="flex flex-col items-center gap-3"
    >
      <div className="w-full px-4 sm:px-0">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex items-center">
            {SLIDES.map(({ key, src }, index) => {
              // Second copy is visual filler for the loop — hide it from AT so
              // each medal is announced once.
              const isClone = index >= MEDALS.length;
              return (
                <div
                  key={`${key}-${index}`}
                  aria-hidden={isClone || undefined}
                  className="flex min-w-0 shrink-0 grow-0 basis-1/3 justify-center"
                >
                  {/* Plain <img>: local SVGs gain nothing from next/image. `origin`
                      is the medal's own centre so the scale tween pulls toward it;
                      no CSS transition — the JS scroll handler drives it. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={isClone ? '' : t(key)}
                    width={160}
                    height={160}
                    // Mobile is fluid (32vw, capped at 9rem): slides are V/3
                    // apart, so a fixed medal overlaps its neighbours on
                    // ≤375px screens — 32vw keeps hero+side clear of each
                    // other and of the edges at every width. `sm:` the column
                    // is a fixed 28rem, so a fixed 10rem medal is safe.
                    className="size-[min(9rem,32vw)] origin-center will-change-transform sm:size-40"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div aria-hidden className="flex items-center gap-1.5">
        {MEDALS.map(({ key }, index) => (
          <span
            key={key}
            className={cn(
              'rounded-full transition-all',
              // 6 snap points (medals ×2) fold back onto 3 dots.
              // bg-primary, not amber: gold belongs to achievement CONTENT
              // (the medal artwork); UI controls stay on the single accent.
              index === selected % MEDALS.length
                ? 'h-1.5 w-4 bg-primary'
                : 'size-1.5 bg-border',
            )}
          />
        ))}
      </div>
    </section>
  );
}
