/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ⬅️ Thêm dòng này
  },
};

module.exports = nextConfig;
