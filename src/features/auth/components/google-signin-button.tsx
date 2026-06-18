'use client';

import Script from 'next/script';
import { useCallback, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { env } from '@/config/env';
import { signinWithGoogle } from '../server/actions';
import { FormError } from './field';

/**
 * "Continue with Google" — renders the official Google Identity Services button
 * and exchanges the returned ID token for a session via the `signinWithGoogle`
 * server action. Hidden entirely when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is unset,
 * so the rest of the auth UI works without Google configured.
 *
 * Uses GIS directly (no wrapper dependency) to stay version-proof on React 19.
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

export function GoogleSigninButton({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

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
  // navigation back to an auth page), so the button is always (re)rendered.
  const renderButton = useCallback(() => {
    if (!clientId || !window.google || !containerRef.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 320,
      locale,
    });
  }, [clientId, handleCredential, locale]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t('or')}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={renderButton}
      />
      <div ref={containerRef} className="flex justify-center" />

      <FormError message={error} />
    </div>
  );
}
