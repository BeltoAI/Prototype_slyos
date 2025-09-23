/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Make it crystal-clear these APIs are runtime:
  experimental: { serverActions: { allowedOrigins: ['*'] } },
};
module.exports = nextConfig;
