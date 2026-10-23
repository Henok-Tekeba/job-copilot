"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The horizontal "Latest internships" rail from the landing reference: a snap
 * scroller with prev/next circles. Cards are server-rendered children so the
 * job payload never reaches the client bundle.
 */
export function RecentCarousel({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({
      left: dir * (ref.current.clientWidth - 80),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
      >
        {React.Children.toArray(children).map((child, i) => (
          <div key={i} className="w-[280px] flex-none snap-start sm:w-[300px]">
            {child}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          aria-label="Previous"
          onClick={() => scroll(-1)}
          className="size-10 rounded-full p-0"
        >
          <ArrowRight className="size-4 rotate-180" />
        </Button>
        <Button
          aria-label="Next"
          onClick={() => scroll(1)}
          className="size-10 rounded-full bg-[#2b4bf2] p-0 text-white hover:bg-[#2340e0]"
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
