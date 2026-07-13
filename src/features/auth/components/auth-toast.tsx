'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/sonner';

// Auth flows redirect on success, so the confirmation toast is fired on the
// destination page from a `?status=` flag the server action appends.
//
// The fire is deferred to a macrotask: this component (page island) mounts and
// runs its effect during hydration, before the <Toaster> (layout island) has
// mounted/subscribed — emitting synchronously there drops the toast. A
// setTimeout lets the Toaster subscribe first. Import `toast` from
// `@/components/ui/sonner` (not 'sonner') so both share one library instance.
const MESSAGE_KEYS = {
  otp_sent: 'toast.otpSent',
  registered: 'toast.registered',
  password_reset: 'toast.passwordReset',
} as const;

export function AuthToast({ status }: { status?: string }) {
  const t = useTranslations('Auth');

  useEffect(() => {
    if (!status) return;
    const key = MESSAGE_KEYS[status as keyof typeof MESSAGE_KEYS];
    if (!key) return;
    const timer = setTimeout(() => {
      // `id` dedupes against React strict-mode's double-invoked effect in dev.
      toast.success(t(key), { id: status });
    });
    return () => clearTimeout(timer);
  }, [status, t]);

  return null;
}
