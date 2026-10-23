"use client";

import * as React from "react";
import Link from "next/link";
import { Asterisk, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
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
    "inline-flex h-9 shrink-0 items-center rounded-lg border px-4 text-[13px] font-medium transition-colors",
    active
      ? "border-[#2b4bf2] bg-[#2b4bf2] text-white"
      : "border-[#e9e9ee] bg-white text-[#5c5c64] hover:border-[#c9c9cf] hover:text-[#14141a]",
  );

/**
 * The board frame from the reference design: a soft-grey hero band holding
 * the header, display title, and the pill search bar; below it, a scrollable
 * category pill row, then the filter rail next to the row list. Only the
 * design-system tokens are used for colour and type; the reference's photo
 * collage has no honest stand-in and is left out.
 */
export function BoardShell({
  tab,
  onTabChange,
  counts,
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
    <div className="min-h-svh bg-white">
      <div className="bg-[#f4f4f6] px-4 pt-4 pb-10 sm:px-8 sm:pb-12">
        <header className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#2b4bf2] text-white">
                <LogoMark className="size-4.5" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-[#14141a]">
                shortlist
              </span>
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              <span className="text-[14px] font-semibold text-[#14141a]">
                Internships
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/skills" className="text-[13px] font-medium text-[#2b4bf2] transition-colors hover:underline">
              Your skills
            </Link>
            <Link href="/privacy" className="text-[13px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
              Privacy
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] pt-6">
          <h1 className="flex flex-wrap items-center gap-3 text-[clamp(1.9rem,3.6vw,2.7rem)] font-medium tracking-[-0.035em] text-[#14141a]">
            Find your dream internship here
            <Asterisk aria-hidden="true" className="hidden size-7 text-[#b9bec2] sm:block" />
          </h1>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-7 flex h-16 items-center rounded-full border border-[#e9e9ee] bg-white p-2 shadow-[0_24px_60px_-30px_rgba(15,15,30,0.3)]"
          >
            <Search className="ml-4 hidden size-4 shrink-0 text-[#6f6f78] sm:block" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Internship or keyword"
              aria-label="Internship or keyword"
              className="h-full min-w-0 flex-1 rounded-full bg-transparent px-4 text-[14.5px] text-[#14141a] outline-none placeholder:text-[#9c9ca4]"
            />
            <span aria-hidden="true" className="mx-1 h-8 w-px shrink-0 bg-[#e9e9ee]" />
            <MapPin className="ml-2 hidden size-4 shrink-0 text-[#6f6f78] sm:block" />
            <input
              value={locationValue}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Add country or city"
              aria-label="Add country or city"
              className="hidden h-full w-44 bg-transparent px-3 text-[14px] text-[#14141a] outline-none placeholder:text-[#9c9ca4] sm:block"
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#2b4bf2] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#2340e0]"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-5">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={pillClass(tab === item.key)}
            >
              {item.label}
              <span
                className={cn(
                  "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[11px] tabular-nums",
                  tab === item.key
                    ? "bg-white/20 text-white"
                    : "border border-[#e9e9ee] bg-white text-[#6f6f78]",
                )}
              >
                {counts[item.key]}
              </span>
            </button>
          ))}

          {sidebarSlot ? (
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e9e9ee] bg-white px-4 text-[13px] font-medium text-[#5c5c64] lg:hidden"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Filters
                  </button>
                }
              />
              <SheetContent side="left" className="w-[320px] max-w-[90vw] overflow-y-auto p-6">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle className="text-[15px] font-semibold">Filters</SheetTitle>
                </SheetHeader>
                {sidebarSlot}
              </SheetContent>
            </Sheet>
          ) : null}

          <span
            aria-hidden="true"
            className="mx-1 hidden h-9 w-px shrink-0 self-center bg-[#e9e9ee] sm:block"
          />

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

        <div className="grid gap-8 pb-16 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <div className="sticky top-6">{sidebarSlot}</div>
          </div>
          <div className="min-w-0">{children}</div>
        </div>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e9e9ee] py-6">
          <Link href="/skills" className="text-[12px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
            Your skills
          </Link>
          <Link href="/privacy" className="text-[12px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
            Privacy
          </Link>
          <Link href="/terms" className="text-[12px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
            Terms
          </Link>
          <Link href="/cookies" className="text-[12px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
            Cookies
          </Link>
          <span className="ml-auto text-[11px] text-[#6f6f78]">
            © {new Date().getFullYear()} Shortlist
          </span>
        </footer>
      </div>
    </div>
  );
}
