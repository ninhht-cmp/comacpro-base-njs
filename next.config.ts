import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import './src/config/env';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    qualities: [75],
    minimumCacheTTL: 14400,
  },
};

export default withNextIntl(nextConfig);
