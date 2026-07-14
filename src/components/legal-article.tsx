import { getTranslations } from 'next-intl/server';

/**
 * Shared renderer for the legal pages (`/terms`, `/privacy`): title, a
 * last-updated line, and titled sections read from the `Legal` namespace.
 *
 * TODO(legal): the current copy is a structural placeholder written to be
 * plausible, NOT lawyer-reviewed. Replace with counsel-approved text (and
 * the company's legal identity in the footer) before launch — store review
 * requires a real privacy policy URL.
 */

/** Bump when the copy changes — shown to the reader, not used for logic. */
export const LEGAL_LAST_UPDATED = '14/07/2026';

export async function LegalArticle({
  document,
  sections,
}: {
  document: 'terms' | 'privacy';
  sections: readonly string[];
}) {
  const t = await getTranslations('Legal');

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t(`${document}.title`)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('updatedAt', { date: LEGAL_LAST_UPDATED })}
        </p>
      </div>
      {sections.map((section) => (
        <section key={section} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {/* Keys are validated by the pages' `as const` section lists. */}
            {t(`${document}.sections.${section}.title` as never)}
          </h2>
          <p className="leading-7 text-muted-foreground">
            {t(`${document}.sections.${section}.body` as never)}
          </p>
        </section>
      ))}
    </main>
  );
}
