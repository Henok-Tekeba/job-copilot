"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The hero's dot-matrix range. This is the same idea as the rest of the site's
 * ASCII work, but instead of a world map it draws terrain: a grid of DM Mono
 * glyphs whose density follows a handful of ridge lines. Colour carries depth,
 * so the foothills stay pale and the foreground goes to the brand blue.
 *
 * Drawn to a canvas rather than rendered as text: the grid is roughly 240 x 100
 * cells on a desktop hero, and that many DOM nodes would cost more than the
 * whole rest of the page. The mark is decorative, so it is hidden from AT.
 */

const GLYPHS = ["·", "·", ":", "+", "*", "#", "#"] as const;

const LIGHT: [number, number, number] = [176, 202, 224];
const BRAND: [number, number, number] = [78, 134, 238];
const DEEP: [number, number, number] = [44, 96, 225];

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number) {
  return (
    hash(x, y) * 0.55 +
    hash(x * 0.47 + 11.3, y * 0.47 + 7.9) * 0.3 +
    hash(x * 0.13 + 3.7, y * 0.13 + 19.1) * 0.15
  );
}

/** Ridge height at x, where 0 is the top of the art and 1 is the bottom. */
function ridgeAt(x: number) {
  // The hero peak left of centre.
  const peak = 0.015 + Math.abs(x - 0.33) * 2.55;
  // The big massif that runs off the right edge.
  const right = 0.005 + (1 - x) * 1.5;
  // Foothills on the left. Past the foothill the ridge is out of the way;
  // without that guard the line goes negative and floods the whole canvas.
  const left = x < 0.38 ? 0.88 - x * 1.2 : 1.2;
  // A smaller shoulder out on the left edge, then a low secondary peak.
  const shoulder = 0.62 + Math.abs(x - 0.04) * 1.1;
  const leftPeak = 0.56 + Math.abs(x - 0.12) * 1.5;
  // A softer ridge behind the peak, so the silhouette has layers.
  const back = 0.51 + Math.abs(x - 0.62) * 0.68;
  // Break the silhouette up so it reads as terrain rather than a graph.
  const edge = (noise(x * 26 + 7, 9.5) - 0.5) * 0.035;
  return Math.min(peak, right, left, shoulder, leftPeak, back) + edge;
}

export function AsciiPeaks({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // One cell per glyph. Keep the cells small enough that the texture
      // reads as a halftone, not as a wall of characters.
      const cell = Math.max(2.9, Math.min(4.4, rect.width / 238));
      const stepY = cell * 1.18;
      const cols = Math.ceil(rect.width / cell) + 1;
      const rows = Math.ceil(rect.height / stepY) + 1;

      ctx.font = `${Math.round(cell * 1.9)}px "DM Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";

      for (let row = 0; row < rows; row++) {
        const y = row / rows;

        for (let col = 0; col < cols; col++) {
          const x = col / cols;
          const top = ridgeAt(x);
          const sky = y < top;

          let density: number;
          if (sky) {
            // A little dust above the ridge, fading out into the page.
            const above = top - y;
            const haze = Math.max(0, 1 - above * 3.4);
            density = haze * (0.035 + 0.055 * noise(x * 9 + 4, y * 9 + 2));
          } else {
            const depth = Math.min(1, (y - top) / Math.max(0.001, 1 - top));
            const grain = noise(x * 7.5 + 21, y * 7.5 + 13);
            const bands =
              0.06 * Math.sin((x * 38 + y * 20) * Math.PI) +
              0.04 * Math.sin((x * 15 - y * 44) * Math.PI);
            density =
              0.26 +
              depth * 1.1 +
              0.6 * Math.exp(-depth * 16) +
              (grain - 0.5) * 0.5 +
              bands * (0.28 + depth * 0.65);
            // The foreground on the right is the densest part of the range.
            const patch =
              Math.max(0, Math.min(1, (x - 0.56) / 0.2)) *
              Math.max(0, Math.min(1, (y - 0.36) / 0.32)) *
              0.32;
            density += patch;

            // The screen print is not a flat screen: clumps of ink and a few
            // bare flecks keep the foreground from turning into a solid grid.
            const texture = noise(x * 23 + 5, y * 19 + 11);
            density += (texture - 0.5) * 0.28 * (1 - depth * 0.5);
            if (depth > 0.62 && texture < 0.085) continue;

            // Soften the very first few cells; the foothills still reach the
            // left edge, as they do in the reference.
            density *= Math.min(1, 0.24 + x * 9);
          }

          if (density <= 0.025) continue;
          if (hash(col * 3.1 + 17, row * 5.7 + 9) > density) continue;

          const depthColor = Math.min(
            1,
            Math.max(
              0,
              (sky ? 0 : (y - top) / Math.max(0.001, 1 - top)) * 1.8 +
                (noise(x * 12 + 3, y * 12 + 8) - 0.5) * 0.22
            )
          );
          const to = depthColor > 0.88 ? DEEP : BRAND;
          const t =
            depthColor > 0.88 ? (depthColor - 0.88) / 0.12 : depthColor / 0.88;
          const r = Math.round(LIGHT[0] + (to[0] - LIGHT[0]) * t);
          const g = Math.round(LIGHT[1] + (to[1] - LIGHT[1]) * t);
          const b = Math.round(LIGHT[2] + (to[2] - LIGHT[2]) * t);

          const alpha = Math.min(
            0.97,
            (sky ? 0.12 : 0.26) + density * (sky ? 0.42 : 0.9)
          );

          // Sparse ink-dark flecks give the halftone its printed tooth.
          const fleck = hash(col * 0.73 + 91, row * 1.31 + 33);
          if (!sky && fleck < 0.018 && depthColor < 0.72) {
            ctx.fillStyle = `rgba(31, 39, 56, ${(0.25 + alpha * 0.4).toFixed(2)})`;
          } else {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
          }

          const glyph = GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(density * GLYPHS.length))];
          ctx.fillText(glyph, col * cell, row * stepY);
        }
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    schedule();

    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);

    // Fonts can arrive after the first paint; redraw once when they do.
    document.fonts?.ready.then(schedule).catch(() => {});

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    />
  );
}
