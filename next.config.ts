import type { NextConfig } from "next";

const isStatic = process.env.NEXT_PUBLIC_STATIC === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: isStatic ? "export" : undefined,
  trailingSlash: true,
  ...(isStatic
    ? {
        basePath,
        assetPrefix: basePath,
        images: { unoptimized: true },
      }
    : {}),
  cacheComponents: !isStatic,
  partialPrefetching: !isStatic,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
