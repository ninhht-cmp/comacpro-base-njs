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
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
