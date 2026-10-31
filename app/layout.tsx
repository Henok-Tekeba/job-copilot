import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Shortlist",
  description: "Tech internships and contracts, scored for international applicants.",
  openGraph: {
    type: "website",
    siteName: "Shortlist",
    title: "Shortlist",
    description: "Tech internships and contracts, scored for international applicants.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shortlist",
    description: "Tech internships and contracts, scored for international applicants.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#252525" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const themeScript = `try{if(localStorage.getItem("jc-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} min-h-full bg-background font-sans text-foreground`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}