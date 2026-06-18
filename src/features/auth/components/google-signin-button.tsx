'use client';

import Script from 'next/script';
import { useCallback, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { env } from '@/config/env';
import { signinWithGoogle } from '../server/actions';
import { FormError } from './field';

/**
 * "Continue with Google" — a fully custom-styled button that still returns a
 * Google ID token. Google Identity Services only hands back an ID token from
 * *its own* rendered button, which can't be restyled. So we render the real GSI
 * button transparently (opacity 0) on top of our custom one and let it fill the
 * area: the user sees our button but clicks Google's. That keeps it a genuine
 * user gesture (no popup-blocker issues) while letting us own the visuals + i18n.
 *
 * The returned ID token is exchanged for a session via `signinWithGoogle`.
 * Hidden entirely when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is unset, so the rest of
 * the auth UI works without Google configured.
 *
 * NOTE on the 403 / "origin is not allowed" GSI error: that is a Google Cloud
 * Console config issue, not a code one — add the current origin (e.g.
 * http://localhost:3000) to the OAuth client's "Authorized JavaScript origins".
 */

interface GsiCredentialResponse {
  credential?: string;
}

interface GsiClient {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: GsiCredentialResponse) => void;
      }): void;
      renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GsiClient;
  }
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function GoogleSigninButton({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const handleCredential = useCallback(
    (response: GsiCredentialResponse) => {
      const idToken = response.credential;
      if (!idToken) {
        setError(t('errors.unknown'));
        return;
      }
      setError(undefined);
      startTransition(async () => {
        const result = await signinWithGoogle(idToken, redirectTo);
        // On success the action redirects; only an error resolves here.
        if (result?.error) setError(result.error);
      });
    },
    [t, redirectTo],
  );

  // `onReady` fires on first load and on every remount (e.g. client-side
  // navigation back to an auth page), so the transparent button is always
  // (re)rendered to match the current container width.
  const renderButton = useCallback(() => {
    const parent = containerRef.current;
    if (!clientId || !window.google || !parent) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });
    // Clear any previous render so remounts don't stack duplicate buttons.
    parent.replaceChildren();
    window.google.accounts.id.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      // Match the overlay to our custom button so the whole surface is clickable.
      width: parent.offsetWidth || 320,
      locale,
    });
  }, [clientId, handleCredential, locale]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        {t('or')}
        <Separator className="flex-1" />
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={renderButton}
      />

      {/* Our custom button is purely visual; the transparent GSI button overlaid
          on top is the real, focusable control that receives the click. */}
      <div className="relative h-10 w-full rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div
          aria-hidden
          className={`flex h-10 w-full items-center justify-center gap-3 rounded-md border border-input bg-background text-sm font-medium text-foreground transition-colors ${
            pending ? 'opacity-60' : ''
          }`}
        >
          <GoogleIcon />
          {pending ? t('google.connecting') : t('google.continue')}
        </div>
        <div
          ref={containerRef}
          className={`absolute inset-0 overflow-hidden opacity-0 ${
            pending ? 'pointer-events-none' : ''
          }`}
        />
      </div>

      <FormError message={error} />
    </div>
  );
}
