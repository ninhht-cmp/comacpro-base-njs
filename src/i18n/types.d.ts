import type { routing } from './routing';
import type { getFormats } from './formats';
import type Common from './messages/vi/Common.json';
import type Home from './messages/vi/Home.json';
import type Errors from './messages/vi/Errors.json';
import type Auth from './messages/vi/Auth.json';
import type Notifications from './messages/vi/Notifications.json';
import type Referrals from './messages/vi/Referrals.json';
import type About from './messages/vi/About.json';
import type Download from './messages/vi/Download.json';
import type Legal from './messages/vi/Legal.json';

type Messages = {
  Common: typeof Common;
  Home: typeof Home;
  Errors: typeof Errors;
  Auth: typeof Auth;
  Notifications: typeof Notifications;
  Referrals: typeof Referrals;
  About: typeof About;
  Download: typeof Download;
  Legal: typeof Legal;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
    Formats: ReturnType<typeof getFormats>;
  }
}
