import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authMessages from '@/i18n/messages/vi/Auth.json';
import { signinWithGoogle } from '../server/actions';
import { GoogleSigninButton } from './google-signin-button';

// Server action: replace the real ('use server' + next/headers) module.
vi.mock('../server/actions', () => ({ signinWithGoogle: vi.fn() }));

// next/script: invoke onReady after mount (mimics the GIS script loading).
vi.mock('next/script', () => ({
  default: ({ onReady }: { onReady?: () => void }) => {
    if (onReady) setTimeout(onReady, 0);
    return null;
  },
}));

const mockAction = vi.mocked(signinWithGoogle);

/** Stub Google Identity Services; capture the credential callback the component registers. */
function stubGis() {
  let callback: ((res: { credential?: string }) => void) | undefined;
  window.google = {
    accounts: {
      id: {
        initialize: (cfg) => {
          callback = cfg.callback;
        },
        renderButton: () => {},
      },
    },
  };
  return {
    isReady: () => callback !== undefined,
    fire: (credential?: string) => callback?.({ credential }),
  };
}

function renderButton() {
  render(
    <NextIntlClientProvider locale="vi" messages={{ Auth: authMessages }}>
      <GoogleSigninButton />
    </NextIntlClientProvider>,
  );
}

describe('GoogleSigninButton', () => {
  beforeEach(() => {
    mockAction.mockReset();
    delete window.google;
  });

  it('calls signinWithGoogle with the credential from GIS', async () => {
    mockAction.mockResolvedValue({});
    const gis = stubGis();
    renderButton();

    await waitFor(() => expect(gis.isReady()).toBe(true));
    gis.fire('credential-token');

    await waitFor(() =>
      expect(mockAction).toHaveBeenCalledWith('credential-token', undefined),
    );
  });

  it('shows the returned error when sign-in fails', async () => {
    mockAction.mockResolvedValue({ error: 'Sai token' });
    const gis = stubGis();
    renderButton();

    await waitFor(() => expect(gis.isReady()).toBe(true));
    gis.fire('credential-token');

    expect(await screen.findByText('Sai token')).toBeInTheDocument();
  });

  it('errors without calling the action when GIS returns no credential', async () => {
    const gis = stubGis();
    renderButton();

    await waitFor(() => expect(gis.isReady()).toBe(true));
    gis.fire(undefined);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(mockAction).not.toHaveBeenCalled();
  });
});
