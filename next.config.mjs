/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for WalletConnect / pino dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Exclude test files from thread-stream
    config.module.rules.push({
      test: /node_modules\/thread-stream\/test/,
      use: 'ignore-loader',
    });

    // Cache for faster rebuilds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [import.meta.url],
      },
    };

    return config;
  },
  // Transpile thirdweb and related packages
  transpilePackages: ['thirdweb'],
  // Experimental features for faster dev
  experimental: {
    optimizePackageImports: ['thirdweb', 'ethers'],
  },
};

export default nextConfig;
