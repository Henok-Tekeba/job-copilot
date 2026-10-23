"use client";

import * as React from "react";

import type { WallSample } from "@/app/page";

/**
 * The wall's posting document, typing itself out as it scrolls into view —
 * the engine reading the posting, performed. The server renders the full
 * static text (the no-JS view is honest); the client snaps to zero on mount
 * and types on intersection. The highlighter swipes the moment the
 * discriminatory phrase starts typing. Reduced motion: static text.
 */
const BASE_SPEED = 150; // chars/second for ordinary text
const PHRASE_SPEED = 85; // the damning line, typed slower

export function WallDocument({ sample }: { sample: WallSample }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [typed, setTyped] = React.useState(sample.before.length);
  const full = sample.before.length + sample.phrase.length + sample.after.length;

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    let start = 0;
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        // Reduced motion or an already-complete read: stay static.
        if (reduced) {
          setTyped(full);
          return;
        }
        setTyped(0);
        const tick = (now: number) => {
          if (!start) start = now;
          const elapsed = (now - start) / 1000;
          let target: number;
          if (elapsed < sample.before.length / BASE_SPEED) {
            target = Math.floor(elapsed * BASE_SPEED);
          } else {
            // Phrase window: from the end of `before`, at the slower pace.
            const phraseElapsed = elapsed - sample.before.length / BASE_SPEED;
            target =
              sample.before.length +
              Math.floor(phraseElapsed * PHRASE_SPEED);
          }
          setTyped(Math.min(target, full));
          if (target < full) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [full, sample.before.length, sample.phrase.length, sample.after.length]);

  const phraseStarted = typed > sample.before.length;
  const beforeText = sample.before.slice(0, Math.min(typed, sample.before.length));
  const phraseText =
    typed > sample.before.length
      ? sample.phrase.slice(0, typed - sample.before.length)
      : "";
  const afterText =
    typed > sample.before.length + sample.phrase.length
      ? sample.after.slice(0, typed - sample.before.length - sample.phrase.length)
      : "";
  const done = typed >= full;

  return (
    <div ref={ref}>
      <p className="mt-4 min-h-[8.6em] text-[14.5px] leading-[1.9] text-[#5c5c64]">
        …{beforeText}
        {phraseStarted || done ? (
          <mark className={`hl font-medium text-[#14141a] ${phraseStarted ? "hl-on" : ""}`}>
            {phraseText}
          </mark>
        ) : null}
        {afterText}
        {!done && <span className="caret" aria-hidden="true" />}
      </p>
    </div>
  );
}
