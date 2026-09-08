import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bugsnap.akusaraproject.my.id';
  const now = new Date();

  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/features', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/help', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/security', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/status', priority: 0.6, changeFrequency: 'daily' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/login', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
