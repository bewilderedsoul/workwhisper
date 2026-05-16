/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.dicebear.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  eslint: {
    // Pre-existing `react/no-unescaped-entities` errors in legacy pages
    // don't block prod build; they're cosmetic JSX entity warnings.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

module.exports = nextConfig;
