import type { RequestHandler } from 'msw';

// MSW request handlers. Empty by default: auto-generation from the OpenAPI spec
// is disabled (the backend's wrapped `BaseResDto<T>` responses make orval emit
// type-invalid faker mocks — see orval.config.ts). Hand-write the handlers you
// need for local dev (`NEXT_PUBLIC_API_MOCKING=enabled`) or tests, e.g.:
//
//   import { http, HttpResponse } from 'msw';
//   export const handlers = [
//     http.get('*/v1/health', () => HttpResponse.json({ status: 'ok' })),
//   ];
//
// Use a leading `*` wildcard so a handler matches regardless of API origin.
export const handlers: RequestHandler[] = [];
