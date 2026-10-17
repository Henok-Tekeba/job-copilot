"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A dot-matrix world map, ~1° of longitude per character. Rendered as runs of
 * land rather than a wall of literals: [row, col, width] on an 80-column grid,
 * compiled once at module scope.
 */
const LAND: Array<[number, number, number]> = [
  // Arctic: Ellesmere, Greenland
  [0, 18, 4],
  [0, 24, 9],
  // Canadian archipelago, Greenland, Siberian coast
  [1, 13, 3],
  [1, 17, 3],
  [1, 22, 3],
  [1, 26, 7],
  [1, 45, 3],
  [1, 50, 26],
  // Alaska, Canada, southern Greenland, Iceland, Scandinavia, Russia
  [2, 4, 5],
  [2, 11, 10],
  [2, 29, 5],
  [2, 37, 3],
  [2, 42, 6],
  [2, 50, 26],
  [3, 3, 6],
  [3, 11, 12],
  [3, 30, 4],
  [3, 39, 3],
  [3, 43, 5],
  [3, 49, 26],
  // Canada/US, British Isles, Europe, Siberia
  [4, 11, 13],
  [4, 39, 3],
  [4, 43, 9],
  [4, 53, 23],
  // US, Iberia, Eurasia
  [5, 10, 14],
  [5, 37, 5],
  [5, 43, 30],
  // US, Turkey, Iran, China, Japan
  [6, 11, 13],
  [6, 47, 5],
  [6, 53, 6],
  [6, 60, 10],
  [6, 71, 3],
  [7, 12, 11],
  [7, 46, 5],
  [7, 52, 6],
  [7, 59, 10],
  [7, 71, 3],
  // US south, the Sahara, Arabia, India, coastal China
  [8, 13, 10],
  [8, 33, 18],
  [8, 53, 4],
  [8, 56, 4],
  [8, 61, 9],
  // Mexico, Cuba, Sahara, Arabia, India, Indochina
  [9, 15, 5],
  [9, 24, 3],
  [9, 32, 18],
  [9, 53, 3],
  [9, 56, 4],
  [9, 62, 5],
  [9, 69, 1],
  // Mexico, the Sahel, Arabia, India, Indochina, the Philippines
  [10, 15, 5],
  [10, 30, 20],
  [10, 53, 3],
  [10, 55, 4],
  [10, 61, 6],
  [10, 69, 2],
  // Central America, West Africa, the Horn, south India, Indochina
  [11, 19, 4],
  [11, 30, 20],
  [11, 50, 4],
  [11, 57, 2],
  [11, 61, 5],
  [11, 70, 1],
  // Panama, Venezuela/the Guianas, Africa, Sri Lanka, Malaysia, Borneo, New Guinea
  [12, 20, 3],
  [12, 24, 7],
  [12, 31, 19],
  [12, 50, 3],
  [12, 58, 1],
  [12, 62, 4],
  [12, 67, 2],
  [12, 72, 5],
  // Amazonia, Africa, Sumatra, Borneo, Sulawesi, New Guinea
  [13, 24, 8],
  [13, 33, 17],
  [13, 61, 4],
  [13, 66, 3],
  [13, 70, 2],
  [13, 73, 5],
  // Brazil, Africa, Indonesia, New Guinea
  [14, 24, 8],
  [14, 34, 16],
  [14, 62, 8],
  [14, 73, 5],
  // Brazil, Africa, Madagascar, Java, Timor, New Guinea
  [15, 24, 9],
  [15, 34, 15],
  [15, 53, 2],
  [15, 63, 6],
  [15, 74, 3],
  // Brazil, middle Africa, Madagascar, northern Australia
  [16, 25, 7],
  [16, 36, 13],
  [16, 53, 2],
  [16, 64, 11],
  // Brazil, southern Africa, Madagascar, Australia
  [17, 25, 7],
  [17, 38, 11],
  [17, 53, 2],
  [17, 64, 12],
  // Argentina, the Kalahari, Australia
  [18, 26, 5],
  [18, 39, 9],
  [18, 64, 12],
  // Argentina, South Africa, Australia
  [19, 27, 4],
  [19, 40, 6],
  [19, 65, 10],
  [20, 27, 4],
  [20, 39, 6],
  [20, 65, 8],
  // Patagonia, Tasmania, New Zealand
  [21, 27, 3],
  [21, 72, 2],
  [21, 77, 1],
  [22, 27, 2],
  [22, 76, 2],
];

/**
 * Where the people who built this are: the Ethiopian highlands and the Horn.
 * Burned into the art at module scope so it stays put while the rest stays a
 * character grid — rendered in the board's "open to you" colour.
 */
const BEACON: Array<[number, number, number]> = [
  [11, 47, 2],
  [12, 46, 5],
  [13, 46, 5],
];

/** Width of the grid, in characters. */
const GRID_WIDTH = 80;
/** Height of the grid, in rows. */
const GRID_HEIGHT = 23;

function build(runs: Array<[number, number, number]>): string[] {
  const grid = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => " ")
  );
  for (const [row, col, width] of runs) {
    grid[row].fill("#", col, col + width);
  }
  return grid.map((line) => line.join("").trimEnd());
}

const ART = build(LAND);
const BEACON_ART = build(BEACON);

/**
 * The site's world mark. Three copies of the same art stack up — the faint
 * plate, a one-shot sweep that prints it in, and a pointer-lit disc — so only
 * the masks ever move, not the glyphs. Ethiopia pulses in the emerald the
 * board already uses for verdicts it trusts.
 *
 * Font size is set on the wrapper (in em-friendly classes); the pre's inherit
 * it, so one passage scales the whole map.
 */
export function AsciiMap({
  className,
  sweep = true,
  lit = true,
}: {
  className?: string;
  sweep?: boolean;
  lit?: boolean;
}) {
  const litRef = React.useRef<HTMLPreElement>(null);

  React.useEffect(() => {
    const lit = litRef.current;
    if (!lit || window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const trace = (x: number, y: number) => {
      const box = lit.getBoundingClientRect();
      lit.style.setProperty(
        "--ascii-x",
        `${(((x - box.left) / box.width) * 100).toFixed(2)}%`
      );
      lit.style.setProperty(
        "--ascii-y",
        `${(((y - box.top) / box.height) * 100).toFixed(2)}%`
      );
    };
    const onMove = (event: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        trace(event.clientX, event.clientY);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute select-none overflow-hidden",
        className
      )}
    >
      <span className="absolute top-[52%] left-[60%] size-40 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-emerald-500/10 blur-3xl" />
      {(
        [
          ["plate", "text-foreground/10", false],
          ...(sweep
            ? ([["ascii-sweep", "text-foreground/55", false]] as const)
            : []),
          ...(lit
            ? ([["ascii-lit", "text-foreground/55", true]] as const)
            : []),
        ] as Array<[string, string, boolean]>
      ).map(([maskClass, inkClass, isLit]) => (
        <pre
          key={maskClass}
          ref={isLit ? litRef : undefined}
          className={cn(
            "absolute top-0 left-1/2 m-0 -translate-x-1/2 font-mono leading-[1.12] whitespace-pre",
            inkClass,
            maskClass
          )}
        >
          {ART.join("\n")}
        </pre>
      ))}
      <pre className="ascii-beacon absolute top-0 left-1/2 m-0 -translate-x-1/2 font-mono leading-[1.12] whitespace-pre">
        {BEACON_ART.join("\n")}
      </pre>
    </div>
  );
}
