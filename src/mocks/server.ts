import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Node-side mock server, used for server-side (RSC / Route Handler) requests
// and tests. Started from `instrumentation.ts` when mocking is enabled.
export const server = setupServer(...handlers);
