import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * Site-wide Open Graph image (Zalo/Facebook link previews — the funnel's
 * first impression). A plain route handler referenced explicitly from
 * metadata (`lib/seo`) instead of the `opengraph-image` file convention: the
 * convention's automatic tag injection is not reliable under the rewritten
 * `[locale]` segment, and an explicit URL is deterministic everywhere. Lives
 * under `/api` so the locale middleware never touches it.
 *
 * Composed from the brand wordmark, so it needs no custom font (satori's
 * default font lacks the Vietnamese glyphs a text layout would need).
 *
 * TODO(product): replace with designed 1200×630 artwork when marketing
 * provides one.
 */

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export async function GET() {
  const logo = await readFile(
    join(process.cwd(), 'public', 'brand', 'logo.svg'),
  );
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF9F5',
      }}
    >
      {/* Satori markup, not the DOM — next/image doesn't apply here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} alt="" width={620} height={124} />
      {/* Brand-orange accent bar anchors the composition (theme_color). */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 14,
          background: '#D97757',
        }}
      />
    </div>,
    {
      ...OG_IMAGE_SIZE,
      // Crawlers re-fetch aggressively; the art only changes on deploy.
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    },
  );
}
