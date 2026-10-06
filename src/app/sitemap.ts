import { MetadataRoute } from 'next';
import { getAllSlugs } from '@/content/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || 'https://bugsnap.akusaraproject.my.id';
  const now = new Date();

  const routes = [
    { path: '',                 priority: 1.0, changeFrequency: 'daily'   as const },
    { path: '/features',        priority: 0.9, changeFrequency: 'weekly'  as const },
    { path: '/pricing',         priority: 0.9, changeFrequency: 'weekly'  as const },
    { path: '/how-it-works',    priority: 0.9, changeFrequency: 'weekly'  as const },
    { path: '/extension',       priority: 0.9, changeFrequency: 'weekly'  as const },
    { path: '/solutions',       priority: 0.8, changeFrequency: 'weekly'  as const },
    { path: '/blog',            priority: 0.8, changeFrequency: 'weekly'  as const },
    { path: '/docs',            priority: 0.8, changeFrequency: 'weekly'  as const },
    { path: '/about',           priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/help',            priority: 0.7, changeFrequency: 'weekly'  as const },
    { path: '/security',        priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/status',          priority: 0.7, changeFrequency: 'daily'   as const },
    { path: '/contact',         priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/privacy',         priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/terms',           priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/login',           priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  const blogSlugs = getAllSlugs().map((slug) => ({
    path: `/blog/${slug}`,
    priority: 0.7 as const,
    changeFrequency: 'monthly' as const,
  }));

  return [...routes, ...blogSlugs].map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
