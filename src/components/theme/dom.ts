// Functions assume a browser environment — only call from client code.
import { THEME_STORAGE_KEY } from './constants';

export type Theme = 'light' | 'dark' | 'system';
export type Resolved = 'light' | 'dark';

export function readStored(): Theme {
  const v = window.localStorage.getItem(THEME_STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

export function resolveTheme(theme: Theme): Resolved {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function disableTransitionsOnce() {
  const style = document.createElement('style');
  style.appendChild(
    document.createTextNode(
      '*,*::before,*::after{transition:none!important;animation:none!important}',
    ),
  );
  document.head.appendChild(style);
  // Force a reflow so the rule lands before we toggle the class.
  void window.getComputedStyle(document.body);
  window.setTimeout(() => style.remove(), 0);
}

export function applyResolved(resolved: Resolved): void {
  const root = document.documentElement;
  const wasDark = root.classList.contains('dark');
  const willBeDark = resolved === 'dark';
  if (wasDark === willBeDark) return; // no-op — avoid spurious transition flush
  disableTransitionsOnce();
  root.classList.toggle('dark', willBeDark);
  root.style.colorScheme = resolved;
}
