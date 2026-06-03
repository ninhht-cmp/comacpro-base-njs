import type { routing } from './routing';
import type { formats } from './formats';
import type Common from './messages/vi/Common.json';
import type Home from './messages/vi/Home.json';
import type Errors from './messages/vi/Errors.json';

type Messages = {
  Common: typeof Common;
  Home: typeof Home;
  Errors: typeof Errors;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
    Formats: typeof formats;
  }
}
