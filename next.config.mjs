/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/c/:id',
        destination: '/v/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
