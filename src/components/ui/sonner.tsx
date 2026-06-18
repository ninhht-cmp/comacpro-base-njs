'use client';

import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader,
} from '@tabler/icons-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/components/theme';

// Re-export `toast` from this single module so every caller shares ONE sonner
// instance. Importing `toast` straight from 'sonner' in a separate client chunk
// yields a second module instance whose store the mounted <Toaster> never sees
// — the toast fires but never renders. Always import `toast` from here.
export { toast } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  // Use the project's own theme system (not next-themes).
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <IconCircleCheck className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
        error: <IconAlertOctagon className="size-4" />,
        loading: <IconLoader className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
