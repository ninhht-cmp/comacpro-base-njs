/**
 * schema.org structured data as an inline JSON-LD script (Google's
 * recommended format). Valid anywhere in the document — Google reads body
 * placement, so layouts/pages can render it next to their content.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The data is authored server-side from static config, but escape `<`
      // anyway so no value can ever close the script element early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
