import Link from "next/link";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";

type HeaderCta = {
  href: string;
  label: string;
};

/**
 * The site chrome. The landing page, board, skills page and legal pages all
 * share one header so the editorial frame never resets between routes.
 */
export function SiteHeader({
  cta = { href: "/jobs", label: "Browse jobs" },
}: {
  cta?: HeaderCta;
}) {
  return (
    <header className="sl-header flex items-center justify-between">
      <Link
        href="/"
        aria-label="Shortlist home"
        className="flex items-center gap-[0.5em]"
      >
        <LogoMark className="size-[1.85em] text-[#0b0b0d]" />
        <span className="font-satoshi text-[1.7em] leading-none font-medium tracking-[-0.045em]">
          Shortlist
        </span>
      </Link>

      <div className="flex items-center gap-[clamp(18px,2.4vw,34px)]">
        <nav className="hidden items-center gap-[clamp(16px,1.85vw,26px)] md:flex">
          <details className="sl-menu group relative">
            <summary className="sl-nav-link flex cursor-pointer list-none items-center gap-1">
              Explore
              <ChevronDown className="size-[0.85em] transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute top-[calc(100%+12px)] left-1/2 z-50 w-56 -translate-x-1/2 border border-[#e8e8e8] bg-white p-2 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.25)]">
              <Link href="/jobs" className="sl-menu-item">
                All internships
              </Link>
              <Link href="/skills" className="sl-menu-item">
                Your skills
              </Link>
              <Link href="/#how" className="sl-menu-item">
                How it works
              </Link>
            </div>
          </details>
          <Link href="/#how" className="sl-nav-link">
            How it works
          </Link>
          <Link href="/#method" className="sl-nav-link">
            Method
          </Link>
          <Link href="/skills" className="sl-nav-link">
            Your skills
          </Link>
        </nav>

        <details className="sl-menu relative md:hidden">
          <summary
            aria-label="Open menu"
            className="grid size-11 cursor-pointer place-items-center border border-[#dedede] bg-white text-[#0b0b0d]"
          >
            <Menu className="size-4" />
          </summary>
          <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-52 border border-[#e8e8e8] bg-white p-2 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.25)]">
            <Link href="/jobs" className="sl-menu-item">
              All internships
            </Link>
            <Link href="/skills" className="sl-menu-item">
              Your skills
            </Link>
            <Link href="/#how" className="sl-menu-item">
              How it works
            </Link>
            <Link href="/#method" className="sl-menu-item">
              Method
            </Link>
          </div>
        </details>

        <Link href={cta.href} className="sl-primary-btn min-h-11">
          {cta.label}
          <ArrowRight className="size-[1.05em]" strokeWidth={1.6} />
        </Link>
      </div>
    </header>
  );
}
