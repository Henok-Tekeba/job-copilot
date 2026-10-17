import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Job Copilot",
    short_name: "Job Copilot",
    description: "Track, score, and close the gap on job opportunities.",
    start_url: "./jobs",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
  };
}
