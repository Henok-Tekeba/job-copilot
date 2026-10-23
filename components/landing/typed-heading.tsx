"use client";

import * as React from "react";

/**
 * A heading that writes itself as it scrolls into view. Same contract as the
 * wall document: the server renders the full text (the honest static view),
 * the client resets on intersection and types. An optional accent tail is
 * written in the accent color, arriving with its letters. Reduced motion:
 * static.
 */
export function TypedHeading({
  ink,
  accent,
  speed = 70,
  className,
}: {
  ink: string;
  accent?: string;
  speed?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  const total = ink.length + (accent?.length ?? 0);
  const [typed, setTyped] = React.useState(total);

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
        if (reduced) {
          setTyped(total);
          return;
        }
        setTyped(0);
        const tick = (now: number) => {
          if (!start) start = now;
          const target = Math.min(
            total,
            Math.floor(((now - start) / 1000) * speed),
          );
          setTyped(target);
          if (target < total) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [total, speed]);

  const inkShown = ink.slice(0, Math.min(typed, ink.length));
  const accentShown =
    accent && typed > ink.length ? accent.slice(0, typed - ink.length) : "";
  const done = typed >= total;

  return (
    <h2 ref={ref} className={className}>
      {inkShown}
      {accent ? (
        <span className="text-[#2b4bf2]">{accentShown}</span>
      ) : null}
      {!done && <span className="caret" aria-hidden="true" />}
    </h2>
  );
}
