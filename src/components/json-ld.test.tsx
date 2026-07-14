import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsonLd } from './json-ld';

describe('JsonLd', () => {
  it('renders the data as an application/ld+json script', () => {
    const { container } = render(
      <JsonLd data={{ '@type': 'Organization', name: 'SaleNet' }} />,
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.innerHTML)).toEqual({
      '@type': 'Organization',
      name: 'SaleNet',
    });
  });

  it('escapes `<` so a value can never close the script element', () => {
    const { container } = render(
      <JsonLd data={{ name: '</script><img src=x onerror=alert(1)>' }} />,
    );
    const html = container.querySelector('script')!.innerHTML;
    expect(html).not.toContain('</script>');
    expect(html).toContain('\\u003c');
    // Still round-trips to the original value.
    expect(JSON.parse(html).name).toBe('</script><img src=x onerror=alert(1)>');
  });
});
