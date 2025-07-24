/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['gsap', 'three', 'chart.js'],
    esmExternals: 'loose' // Helps with WalletConnect ESM issues : Added by @Darshan
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });

    config.ignoreWarnings = [
      { module: /node_modules\/three/ },
      { module: /node_modules\/gsap/ },
      { module: /node_modules\/chart.js/ },
      { module: /node_modules\/@walletconnect/ }, 
      { module: /node_modules\/wagmi/ },          
      { module: /node_modules\/viem/ },           
      /Critical dependency: the request of a dependency is an expression/, 
    ];

    // ADDED: Externalize problematic packages during SSR by @vigneshhk
    if (isServer) {
      config.externals.push('pino-pretty', 'encoding', '@walletconnect/keyvaluestorage');
    }

    return config;
  },
  env: {
    NEXT_PUBLIC_PROJECT_ID: '5bd2fb1271f048ef01b0252c4758ca7f',
    NEXT_PUBLIC_LIVESTOCK_MANAGER_ADDRESS: '0x724550c719e4296B8B75C8143Ab6228141bC7747',
    NEXT_PUBLIC_LIVESTOCK_ASSET_NFT_ADDRESS: '0x6740bcf0BF975a270d835617Bb516D7c4ACEceA4',
    NEXT_PUBLIC_TEST_STABLECOIN_ADDRESS: '0xcE3C341664C9D836b7748429Afae9A19088bf9Be',
    NEXT_DISABLE_VERSION_NOTIFICATION: '1', 
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  // ADDED: Force client-side rendering for problematic pages
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy', 
            value: 'same-origin-allow-popups'
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
