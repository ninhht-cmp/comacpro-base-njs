'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { THEME_STORAGE_KEY } from './constants';
import {
  applyResolved,
  readStored,
  resolveTheme,
  type Resolved,
  type Theme,
} from './dom';

export type { Theme, Resolved };

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type Ctx = {
  theme: Theme;
  /**
   * `null` during SSR / before mount. Consumers rendering branch-different
   * markup must guard for `null` or they will trigger a hydration mismatch.
   */
  resolvedTheme: Resolved | null;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) cb();
  };
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener('storage', onStorage);
  mql.addEventListener('change', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
    mql.removeEventListener('change', cb);
  };
}

const getThemeSnapshot = () => readStored();
const getResolvedSnapshot = () => resolveTheme(readStored());
const themeServerSnapshot = (): Theme => 'system';
const resolvedServerSnapshot = (): Resolved | null => null;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    themeServerSnapshot,
  );
  const resolvedTheme = useSyncExternalStore<Resolved | null>(
    subscribe,
    getResolvedSnapshot,
    resolvedServerSnapshot,
  );

  // React drops the `dark` class on <html> when it reconciles after a locale
  // switch — re-apply pre-paint so the swap is invisible.
  useIsoLayoutEffect(() => {
    if (resolvedTheme !== null) applyResolved(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyResolved(resolveTheme(next));
    notify();
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
