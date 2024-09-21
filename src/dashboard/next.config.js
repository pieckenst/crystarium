const { resolve } = require('path');

const dashboardPath = resolve(process.cwd(), 'dashboard');


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com'
      }
    ]
  }
};

module.exports = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          process: require.resolve('process/browser'),
        };
      }
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': dashboardPath,
      };
      return config;
    },
  };