'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { env } from '@/config/env';

/**
 * Cloudflare Turnstile widget (managed anti-bot challenge). Renders nothing
 * when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset — the server side skips
 * verification too (`src/lib/security/turnstile.ts`), so the feature is one env pair
 * away from on/off with no code changes.
 *
 * Explicit rendering (not the `cf-turnstile` class) because tokens are
 * SINGLE-USE: after a rejected submit the form re-renders with the old,
 * already-consumed token, so the widget must be reset — pass the action's
 * state as `resetKey` (a new object identity per action return). The widget
 * injects its token as a hidden `cf-turnstile-response` input into the
 * enclosing form.
 */

interface TurnstileApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'flexible' | 'compact';
    },
  ) => string | undefined;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>(undefined);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    let timer: number | undefined;
    // Poll instead of next/script's onLoad: onLoad fires once per script
    // load, not per component mount, so a remount would never render.
    const renderWidget = () => {
      if (cancelled || widgetIdRef.current !== undefined) return;
      const container = containerRef.current;
      if (window.turnstile && container) {
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'auto',
          // Spans the form column instead of Turnstile's fixed 300px box.
          size: 'flexible',
        });
      } else {
        timer = window.setTimeout(renderWidget, 100);
      }
    };
    renderWidget();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      if (widgetIdRef.current !== undefined) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, [siteKey]);

  // Fresh token after every action return (see the header comment).
  const lastResetKey = useRef(resetKey);
  useEffect(() => {
    if (resetKey === lastResetKey.current) return;
    lastResetKey.current = resetKey;
    if (widgetIdRef.current !== undefined) {
      window.turnstile?.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
    </>
  );
}
