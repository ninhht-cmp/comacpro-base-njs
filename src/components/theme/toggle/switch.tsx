'use client';

import { useTranslations } from 'next-intl';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useTheme, type Theme } from '../provider';
import { cn } from '@/lib/utils';

const OPTIONS: ReadonlyArray<{
  value: Theme;
  Icon: React.ComponentType<{ className?: string }>;
  i18nKey: 'light' | 'dark' | 'system';
}> = [
  { value: 'light', Icon: IconSun, i18nKey: 'light' },
  { value: 'dark', Icon: IconMoon, i18nKey: 'dark' },
  { value: 'system', Icon: IconDeviceDesktop, i18nKey: 'system' },
];

export function ThemeToggleSwitch() {
  const t = useTranslations('Common.theme');
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t('toggle')}
      className="inline-flex items-center rounded-md bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, Icon, i18nKey }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(i18nKey)}
          </button>
        );
      })}
    </div>
  );
}
