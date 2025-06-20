/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '@supabase/realtime-js'];
    }
    return config;
  },
}

module.exports = nextConfig 