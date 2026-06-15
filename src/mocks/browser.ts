import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Browser-side mock worker. Started by `MswProvider` when
// `NEXT_PUBLIC_API_MOCKING=enabled`. Requires `public/mockServiceWorker.js`
// (generated via `pnpm exec msw init public`).
export const worker = setupWorker(...handlers);
