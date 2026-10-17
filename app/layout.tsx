import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Copilot",
  description: "Track, score, and close the gap on job opportunities.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

/**
 * Runs before first paint: dark is the default ground, and the only job here
 * is to drop back to light if that is what the visitor chose last time. Kept
 * inline and tiny so the page never flashes dark first.
 */
const themeScript = `try{if(localStorage.getItem("jc-theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-background font-sans text-foreground`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
