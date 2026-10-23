import Link from "next/link";
import type { ReactNode } from "react";

import { LogoMark } from "@/components/logo-mark";

/**
 * The legal-page frame: the raised card on a white stage — same geometry as
 * the internship detail card — with the site chrome on top.
 */
export function LegalPage({
  title,
  updated = "October 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-white px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex h-10 w-full max-w-[820px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#2b4bf2] text-white">
            <LogoMark className="size-4.5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#14141a]">
            shortlist
          </span>
        </Link>
        <Link
          href="/jobs"
          className="text-[13px] font-medium text-[#5c5c64] transition-colors hover:text-[#14141a]"
        >
          Board
        </Link>
      </div>

      <div className="mx-auto mt-4 w-full max-w-[820px] flex-1 rounded-[28px] border border-[#ececf0] bg-white px-6 py-8 shadow-[0_24px_64px_-28px_rgba(15,15,30,0.25)] sm:px-10 sm:py-10">
        <h1 className="text-[clamp(1.8rem,3.6vw,2.5rem)] font-medium tracking-[-0.03em] text-[#14141a]">
          {title}
        </h1>
        <p className="mt-2 text-[12px] text-[#6f6f78]">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-6">{children}</div>
      </div>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#14141a]">
        {heading}
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[13.5px] leading-relaxed text-[#5c5c64]">{children}</p>;
}
