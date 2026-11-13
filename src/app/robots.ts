import { MetadataRoute } from 'next';

// Private surfaces. Robots only stops crawling, so every one of these also gets
// X-Robots-Tag: noindex from middleware. Keep this list in sync with middleware.ts.
const PRIVATE_DISALLOW = [
  '/api',
  '/admin',
  '/dashboard',
  '/captures',
  '/compare',
  '/folders',
  '/settings',
  '/welcome',
  '/upgrade',
  '/v',
  '/uninstall-feedback',
];

const PUBLIC_ALLOW = [
  '/',
  '/pricing',
  '/features',
  '/how-it-works',
  '/extension',
  '/solutions',
  '/about',
  '/docs',
  '/visual-compare',
  '/privacy',
  '/terms',
  '/security',
  '/contact',
  '/help',
  '/status',
  '/blog',
  '/blog/*',
  '/login',
  '/icon.png',
  '/icon.svg',
  '/opengraph-image.png',
  '/twitter-image.png',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || 'https://bugsnap.akusaraproject.my.id';
  return {
    rules: [
      { userAgent: '*', allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
      { userAgent: 'Googlebot', allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
