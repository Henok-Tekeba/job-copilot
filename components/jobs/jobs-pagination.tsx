"use client";

import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Windowed page numbers: always show the ends, plus a few around the current
 * page, with ellipses for the gaps.
 */
function pageWindow(pageIndex: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }

  const pages = new Set<number>([0, pageCount - 1]);
  for (let i = pageIndex - 1; i <= pageIndex + 1; i++) {
    if (i > 0 && i < pageCount - 1) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let previous = -1;
  for (const page of sorted) {
    if (previous >= 0 && page - previous > 1) out.push("gap");
    out.push(page);
    previous = page;
  }
  return out;
}

export function JobsPagination({
  pageIndex,
  pageSize,
  total,
  onPageChange,
}: {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageChange: (index: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  const first = pageIndex * pageSize + 1;
  const last = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="mt-8 flex flex-col items-center gap-3 border-t border-[#ececec] pt-6">
      <Pagination>
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={pageIndex === 0}
              className={
                pageIndex === 0
                  ? "pointer-events-none rounded-none border-[#ececec] font-mono text-[10px] uppercase opacity-40 [&>span]:hidden sm:[&>span]:inline-flex"
                  : "rounded-none border-[#e2e2e2] font-mono text-[10px] uppercase [&>span]:hidden sm:[&>span]:inline-flex"
              }
              onClick={(event) => {
                event.preventDefault();
                if (pageIndex > 0) onPageChange(pageIndex - 1);
              }}
            />
          </PaginationItem>

          {pageWindow(pageIndex, pageCount).map((entry, i) =>
            entry === "gap" ? (
              <PaginationItem key={`gap-${i}`}>
                <PaginationEllipsis className="size-8" />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  isActive={entry === pageIndex}
                  className={
                    entry === pageIndex
                      ? "rounded-none border-[#548bff] bg-[#f8fbff] font-mono text-[11px] text-[#548bff] tabular-nums"
                      : "rounded-none border border-[#e2e2e2] bg-white font-mono text-[11px] tabular-nums"
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(entry);
                  }}
                >
                  {entry + 1}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              aria-disabled={pageIndex >= pageCount - 1}
              className={
                pageIndex >= pageCount - 1
                  ? "pointer-events-none rounded-none border-[#ececec] font-mono text-[10px] uppercase opacity-40 [&>span]:hidden sm:[&>span]:inline-flex"
                  : "rounded-none border-[#e2e2e2] font-mono text-[10px] uppercase [&>span]:hidden sm:[&>span]:inline-flex"
              }
              onClick={(event) => {
                event.preventDefault();
                if (pageIndex < pageCount - 1) onPageChange(pageIndex + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="font-mono text-[10px] tracking-[0.04em] text-[#9a9a9a] tabular-nums">
        {first}–{last} of {total}
      </p>
    </div>
  );
}
