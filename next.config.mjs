import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  compress: true,
  poweredByHeader: false,
  // Icon/image URLs append ?v=<version> (see src/lib/iconify.ts) so the
  // immutable 1-year Cache-Control below can't pin a stale asset in the
  // browser forever after its content changes at the same filename.
  env: {
    NEXT_PUBLIC_ASSET_VERSION: pkg.version,
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|png|jpg|jpeg|webp|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/c/:id',
        destination: '/v/:id',
        permanent: true,
      },
      {
        source: '/embed/:id',
        destination: '/v/:id?embed=true',
        permanent: true,
      },
      {
        source: '/extension/firefox',
        destination: 'https://addons.mozilla.org/addon/bugsnap/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
