import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SaleNet',
    short_name: 'SaleNet',
    description: 'Nền tảng Đại diện Thương mại SaleNet.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F5',
    theme_color: '#D97757',
    // `src/app/icon.svg` — Next serves it and injects the <link rel="icon">.
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
