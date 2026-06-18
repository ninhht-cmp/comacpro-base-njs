import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/server';

// Reuse the project's MSW server so integration tests can stub the backend the
// same way local dev does. Handlers are added per-test with `server.use(...)`.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
