/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // keep whatever options you had:
  experimental: { serverActions: { allowedOrigins: ['*'] } },
};
export default nextConfig;
