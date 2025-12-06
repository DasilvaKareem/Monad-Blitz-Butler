/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use webpack instead of turbopack for better compatibility with thirdweb
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

    return config;
  },
  // Transpile thirdweb and related packages
  transpilePackages: ['thirdweb'],
};

export default nextConfig;
