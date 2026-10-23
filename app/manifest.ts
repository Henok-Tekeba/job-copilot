import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shortlist",
    short_name: "Shortlist",
    description: "Tech internships and contracts, scored for international applicants.",
    start_url: "./jobs",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2b4bf2",
    icons: [
      {
        src: "./icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
