"use client";

import * as React from "react";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLabel } from "@/components/site/site-label";
import { SiteShell } from "@/components/site/site-shell";
import type { OpportunityFilter } from "@/components/jobs/board-filters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "cn";

export type BoardTab = "all" | "saved" | "applied";

const TABS: Array<{ key: BoardTab; label: string }> = [
  { key: "all", label: "All roles" },
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
];

const OPPORTUNITY_PILLS: Array<{ value: OpportunityFilter; label: string }> = [
  { value: "internship", label: "Internships" },
  { value: "contract", label: "Contract" },
];

const pillClass = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center border px-4 font-mono text-[10px] tracking-[0.06em] uppercase transition-colors",
    active
      ? "border-[#548bff] bg-[#548bff] text-white"
      : "border-[#e2e2e2] bg-white text-[#5f5f65] hover:border-[#bdbdbd] hover:text-[#0b0b0d]",
  );

/**
 * The board sheet. The hero band carries the one sentence the board is for and
 * the search; everything below it is ruled, not carded, so a long list still
 * reads like a document rather than a dashboard.
 */
export function BoardShell({
  tab,
  onTabChange,
  counts,
  resultCount,
  opportunityFilter,
  onOpportunityFilterChange,
  searchValue,
  onSearchChange,
  locationValue,
  onLocationChange,
  sidebarSlot,
  children,
}: {
  tab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
  counts: { all: number; saved: number; applied: number };
  resultCount?: number;
  opportunityFilter: OpportunityFilter;
  onOpportunityFilterChange: (value: OpportunityFilter) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  locationValue: string;
  onLocationChange: (value: string) => void;
  sidebarSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="sl-landing min-h-svh bg-white">
      <SiteHeader cta={{ href: "/skills", label: "Get matched" }} />

      <SiteShell>
        <section className="relative overflow-hidden border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] pt-[clamp(24px,3.3vw,48px)] pb-[clamp(26px,3.4vw,50px)]">
          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-[34%] overflow-hidden md:block">
            <div className="absolute -top-1/2 right-[-20%] size-[34rem] rounded-full border border-[#f0f0f0]" />
            <div className="absolute -top-1/3 right-[-8%] size-[26rem] rounded-full border border-[#f2f2f2]" />
            <div className="absolute top-[8%] right-[4%] size-[18rem] rounded-full border border-[#f4f4f4]" />
          </div>

          <div className="relative">
            <SiteLabel>The board</SiteLabel>
            <h1 className="sl-display-sm mt-[clamp(16px,2.2vw,30px)] max-w-[20ch]">
              Find work that takes you{" "}
              <span className="text-[#548bff]">anywhere.</span>
            </h1>
            <p className="mt-[clamp(14px,1.6vw,22px)] max-w-[34rem] text-[clamp(12px,1.03vw,15px)] leading-[1.6] text-[#6a6a70]">
              Internships and contracts only, read for eligibility, fit, and
              deadlines before they reach this list. Everything stays on your
              device.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-[clamp(22px,2.7vw,38px)] grid w-full max-w-[900px] grid-cols-1 border border-[#e2e2e2] bg-white sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto]"
            >
              <div className="flex h-[clamp(48px,4.3vw,58px)] min-w-0 items-center border-b border-[#e2e2e2] px-4 sm:border-b-0">
                <Search className="mr-3 size-4 shrink-0 text-[#77777d]" />
                <input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  data-search-input
                  placeholder="Internship, company, or skill"
                  aria-label="Internship, company, or skill"
                  className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-[#0b0b0d] outline-none placeholder:text-[#9a9a9a]"
                />
              </div>
              <div className="flex h-[clamp(48px,4.3vw,58px)] min-w-0 items-center border-b border-[#e2e2e2] px-4 sm:border-b-0 sm:border-l">
                <MapPin className="mr-3 size-4 shrink-0 text-[#77777d]" />
                <input
                  value={locationValue}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder="Country or city"
                  aria-label="Country or city"
                  className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-[#0b0b0d] outline-none placeholder:text-[#9a9a9a]"
                />
              </div>
              <button
                type="submit"
                className="sl-primary-btn h-[clamp(48px,4.3vw,58px)] min-h-11 rounded-none px-[clamp(22px,2.4vw,36px)]"
              >
                Search
                <Search className="size-[1.05em]" strokeWidth={1.6} />
              </button>
            </form>
          </div>
        </section>

        <section className="border-t border-[#ececec]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-3">
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
              {TABS.map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onTabChange(item.key)}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-2 border-b-2 px-3 font-mono text-[10px] tracking-[0.05em] uppercase transition-colors",
                      active
                        ? "border-[#548bff] text-[#0b0b0d]"
                        : "border-transparent text-[#77777d] hover:text-[#0b0b0d]",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center border px-1 font-mono text-[9.5px] tabular-nums",
                        active
                          ? "border-[#548bff] bg-[#f8fbff] text-[#548bff]"
                          : "border-[#e2e2e2] bg-white text-[#8f8f94]",
                      )}
                    >
                      {counts[item.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <span
              aria-hidden="true"
              className="hidden h-6 w-px bg-[#ececec] sm:block"
            />

            <div className="flex flex-wrap items-center gap-2">
              {OPPORTUNITY_PILLS.map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() =>
                    onOpportunityFilterChange(
                      opportunityFilter === pill.value ? "all" : pill.value,
                    )
                  }
                  className={pillClass(opportunityFilter === pill.value)}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {sidebarSlot ? (
              <Sheet>
                <SheetTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 border border-[#e2e2e2] bg-white px-4 font-mono text-[10px] tracking-[0.05em] uppercase text-[#5f5f65] lg:hidden"
                    >
                      <SlidersHorizontal className="size-3.5" />
                      Filters
                    </button>
                  }
                />
                <SheetContent
                  side="left"
                  className="w-[320px] max-w-[90vw] overflow-y-auto p-6"
                >
                  <SheetHeader className="mb-4 text-left">
                    <SheetTitle className="text-[15px] font-semibold">
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  {sidebarSlot}
                </SheetContent>
              </Sheet>
            ) : null}

            <p className="ml-auto hidden font-mono text-[10px] tracking-[0.05em] text-[#77777d] uppercase md:block">
              {typeof resultCount === "number"
                ? `${resultCount.toLocaleString("en-US")} roles in view`
                : "Reading the board"}
            </p>
          </div>

          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden border-r border-[#ececec] pl-[clamp(18px,2.75vw,40px)] pr-[clamp(14px,1.4vw,22px)] py-8 lg:block">
              <div className="sticky top-6">{sidebarSlot}</div>
            </aside>

            <div className="min-w-0 pl-[clamp(18px,1.4vw,22px)] pr-[clamp(18px,2.75vw,40px)] py-6 lg:py-8">
              {children}
            </div>
          </div>
        </section>

        <SiteFooter />
      </SiteShell>
    </main>
  );
}
