import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bugsnap.akusaraproject.my.id';
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
          '/v/*',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/captures/',
          '/settings/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
