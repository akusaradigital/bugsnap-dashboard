/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

export default nextConfig;
