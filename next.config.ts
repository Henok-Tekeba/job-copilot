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
  // The Pages deploy is an `output: "export"` build, which requires
  // `export const dynamic = "force-static"` on route handlers and metadata
  // routes. cacheComponents forbids that config, so dev has to run the same
  // model as the export or those files fail to compile. Nothing in the app
  // uses `use cache`, so nothing is lost.
  cacheComponents: false,
  partialPrefetching: false,
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
