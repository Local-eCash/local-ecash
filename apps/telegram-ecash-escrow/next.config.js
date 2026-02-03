/** @type {import('next').NextConfig} */
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin')

const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['@bcpros/lixi-models', '@bcpros/redux-store'],
  webpack(config, { defaultLoaders, isServer }) {

    config.module.rules.push({
      test: /\.m?js$/i,
      use: ['source-map-loader'],
      enforce: 'pre',
      exclude: /node_modules/,
    });
    config.devtool = 'source-map';

    config.resolve.alias = {
      ...config.resolve.alias,
      '@store': path.resolve(__dirname, "node_modules/@bcpros/redux-store/build/main/store"),
      '@bcpros/redux-store': path.resolve(__dirname, "node_modules/@bcpros/redux-store"),
      "@nestjs/graphql": path.resolve(__dirname, "node_modules/@nestjs/graphql/dist/extra/graphql-model-shim"),
      // Alias bitcore-lib-xpi to @abcpros/bitcore-lib for compatibility
      "bitcore-lib-xpi": path.resolve(__dirname, "node_modules/@abcpros/bitcore-lib"),
    };

    config.experiments = { asyncWebAssembly: true, syncWebAssembly: true, layers: true };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "fs": false,
        "tls": false,
        "tty": false,
        "net": false,
        "path": false,
        "zlib": false,
        "http": false,
        "https": false,
        "stream": false,
        "crypto": false,
        "async_hooks": false,
        "child_process": false,
      }
    } else {
      // This line is necessary to avoid the error 
      // Error: ENOENT: no such file or directory, 
      // '/home/ken/Work/ecash-escrow/apps/telegram-ecash-escrow/
      //      .next/server/vendor-chunks/ecash_lib_wasm_bg_nodejs.wasm'
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'node_modules/ecash-lib/dist/ffi/ecash_lib_wasm_bg_nodejs.wasm'),
              to: path.resolve(__dirname, '.next/server/chunks/ecash_lib_wasm_bg_nodejs.wasm'),
            },
            {
              from: path.resolve(__dirname, 'node_modules/ecash-lib/dist/ffi/ecash_lib_wasm_bg_nodejs.wasm'),
              to: path.resolve(__dirname, '.next/server/vendor-chunks/ecash_lib_wasm_bg_nodejs.wasm'),
            }
          ],
        })
      );
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    esmExternals: "loose",
    optimizePackageImports: ['@bcpros/lixi-models', '@bcpros/redux-store']
    // optimizePackageImports: ['@bcpros/redux-store']
  },
  productionBrowserSourceMaps: true
};

const config = nextConfig;


if (process.env.ANALYZE === 'true') {
  // @ts-ignore
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  config = withBundleAnalyzer(config);
}

const withPWA = require('next-pwa')({
  dest: 'public',
  disableDevLogs: true,
});

module.exports = withPWA(config);
