import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";

/** The 404 in the design system: the raised card on the white stage. */
export default function NotFound() {
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

      <div className="mx-auto mt-4 flex w-full max-w-[820px] flex-1 flex-col items-start justify-center rounded-[28px] border border-[#ececf0] bg-white px-6 py-8 shadow-[0_24px_64px_-28px_rgba(15,15,30,0.25)] sm:px-10 sm:py-10">
        <p className="font-semibold tracking-[-0.02em] text-[#2b4bf2]">404</p>
        <h1 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.02em] text-[#14141a]">
          This page is not on the board
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[#8b8b93]">
          The link is old or the page moved. The internship board is where
          everything lives.
        </p>
        <Link
          href="/jobs"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#2b4bf2] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#2340e0]"
        >
          Go to the board
        </Link>
      </div>
    </main>
  );
}
