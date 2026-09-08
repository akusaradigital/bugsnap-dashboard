import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || 'https://bugsnap.akusaraproject.my.id';
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/features',
          '/privacy',
          '/terms',
          '/security',
          '/contact',
          '/help',
          '/status',
          '/login',
          '/icon.png',
          '/icon.svg',
          '/opengraph-image.png',
          '/twitter-image.png',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/captures/',
          '/settings/',
          '/v/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/pricing',
          '/features',
          '/privacy',
          '/terms',
          '/security',
          '/contact',
          '/help',
          '/status',
          '/login',
          '/icon.png',
          '/icon.svg',
          '/opengraph-image.png',
          '/twitter-image.png',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/captures/',
          '/settings/',
          '/v/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
