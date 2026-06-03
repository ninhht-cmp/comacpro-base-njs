'use client';

import { useTranslations } from 'next-intl';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useTheme, type Theme } from '../provider';
import { Button } from '@/components/ui/button';

const NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const ICON: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: IconSun,
  dark: IconMoon,
  system: IconDeviceDesktop,
};

export function ThemeToggleCompact() {
  const t = useTranslations('Common.theme');
  const { theme, setTheme } = useTheme();
  const Icon = ICON[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={t('toggle')}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
