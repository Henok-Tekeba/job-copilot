import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLabel } from "@/components/site/site-label";
import { SiteShell } from "@/components/site/site-shell";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The legal sheet: the same ruled frame as the board, with numbered sections
 * so a long policy can be scanned without turning into a wall of text.
 */
export function LegalPage({
  title,
  updated = "October 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  const contents = React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<{ heading?: string }>(child)) return [];
    const heading = child.props.heading;
    return heading ? [{ heading, id: slugify(heading) }] : [];
  });

  return (
    <main className="sl-landing min-h-dvh bg-white text-[#0b0b0d]">
      <SiteHeader />

      <SiteShell>
        <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] pt-[clamp(28px,3.6vw,52px)] pb-[clamp(26px,3.4vw,48px)]">
          <SiteLabel>Legal</SiteLabel>
          <div className="mt-[clamp(18px,2.4vw,34px)] flex flex-wrap items-end justify-between gap-6">
            <h1 className="sl-display-sm max-w-[18ch]">
              {title}
              <span className="text-[#548bff]">.</span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.05em] text-[#8f8f94] uppercase">
              Last updated {updated}
            </p>
          </div>
          <p className="mt-[clamp(14px,1.8vw,24px)] max-w-[38rem] text-[clamp(12px,1.03vw,15px)] leading-[1.65] text-[#9a9a9a]">
            The short version is always the first section. Everything below it
            is the long version, written to be read.
          </p>
        </section>

        <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(30px,4vw,58px)]">
          <div className="grid gap-[clamp(28px,5vw,80px)] md:grid-cols-[190px_minmax(0,1fr)]">
            <aside className="hidden md:block">
              <div className="sticky top-6">
                <SiteLabel>On this page</SiteLabel>
                <nav aria-label="On this page" className="mt-4 flex flex-col">
                  {contents.map((item, index) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="group flex items-baseline gap-3 border-t border-[#ececec] py-2.5 text-[12px] leading-[1.35] text-[#77777d] transition-colors hover:text-[#0b0b0d]"
                    >
                      <span className="font-mono text-[9px] text-[#548bff]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.heading}
                    </a>
                  ))}
                </nav>
                <Link
                  href="/jobs"
                  className="sl-text-link mt-6 inline-flex items-center gap-1.5"
                >
                  Back to the board
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </aside>

            <div className="sl-legal-body min-w-0">{children}</div>
          </div>
        </section>

        <SiteFooter />
      </SiteShell>
    </main>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={slugify(heading)}
      className="sl-legal-section flex scroll-mt-6 flex-col gap-3"
    >
      <h2 className="font-satoshi text-[clamp(1.15rem,1.5vw,1.55rem)] leading-[1.2] font-medium tracking-[-0.025em] text-[#050506]">
        {heading}
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[clamp(13px,1.03vw,15px)] leading-[1.85] text-[#5f5f65]">
      {children}
    </p>
  );
}
