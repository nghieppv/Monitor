import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  webpack(config: any) {
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};
    try {
      // Provide browser polyfills for Node core modules used by some libs
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      config.resolve.fallback.crypto = require.resolve("crypto-browserify");
    } catch {}
    try {
      // Optional: other core shims
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      config.resolve.fallback.stream = require.resolve("stream-browserify");
    } catch {}
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      config.resolve.fallback.util = require.resolve("util/");
    } catch {}
    return config;
  },
};

export default nextConfig;
