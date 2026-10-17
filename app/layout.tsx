import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

/**
 * Two faces, chosen rather than inherited.
 *
 * Geist is what `create-next-app` ships with, which makes it a non-decision.
 * Archivo is a grotesque with tight, slightly industrial proportions that hold
 * up at the small sizes this interface runs at. IBM Plex Mono carries the
 * numbers: scores and dates sit in ranked columns and have to align down the
 * edge of the list, which proportional figures cannot do.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Job Copilot",
  description: "Tech internships and contracts you can actually get.",
};

export const viewport: Viewport = {
  themeColor: "#111a2b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body
        className={`${archivo.variable} ${plexMono.variable} min-h-full bg-background font-sans text-foreground`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
