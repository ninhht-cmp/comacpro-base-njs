// Server-side API surface: the shared transport plus the generated model
// types under `./generated/model` (imported directly where needed).
export {
  ApiError,
  errorMessageFrom,
  serverFetch,
  type ServerFetchOptions,
} from './server-fetch';
