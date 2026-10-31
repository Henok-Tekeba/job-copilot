import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLabel } from "@/components/site/site-label";
import { SiteShell } from "@/components/site/site-shell";

/** The 404 in the site's ruled-sheet language. */
export default function NotFound() {
  return (
    <main className="sl-landing min-h-dvh bg-white text-[#0b0b0d]">
      <SiteHeader />

      <SiteShell>
        <section className="flex min-h-[calc(100dvh-9rem)] items-center border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(48px,8vw,120px)]">
          <div className="max-w-[44rem]">
            <SiteLabel>404</SiteLabel>
            <h1 className="sl-display-sm mt-[clamp(18px,2.4vw,34px)] max-w-[16ch]">
              This page is not on the board
              <span className="text-[#548bff]">.</span>
            </h1>
            <p className="mt-[clamp(16px,1.8vw,26px)] max-w-[30rem] text-[clamp(12px,1.03vw,15px)] leading-[1.65] text-[#9a9a9a]">
              The link is old or the page moved. The board is where the
              internships and contracts live.
            </p>
            <div className="mt-[clamp(20px,2.4vw,34px)] flex flex-wrap gap-[clamp(8px,0.75vw,12px)]">
              <Link
                href="/jobs"
                className="sl-primary-btn h-[clamp(38px,3.2vw,46px)] min-h-11"
              >
                Go to the board
                <ArrowRight className="size-[1.1em]" strokeWidth={1.6} />
              </Link>
              <Link
                href="/"
                className="sl-secondary-btn h-[clamp(38px,3.2vw,46px)] min-h-11"
              >
                Back home
                <ArrowUpRight className="size-[0.9em]" strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </SiteShell>
    </main>
  );
}
