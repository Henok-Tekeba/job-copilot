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
    <div className="flex flex-col items-center gap-2 pt-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={pageIndex === 0}
              className={
                pageIndex === 0 ? "pointer-events-none opacity-50" : undefined
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
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  isActive={entry === pageIndex}
                  className="font-mono text-xs tabular-nums"
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
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                if (pageIndex < pageCount - 1) onPageChange(pageIndex + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        {first}–{last} of {total}
      </p>
    </div>
  );
}
