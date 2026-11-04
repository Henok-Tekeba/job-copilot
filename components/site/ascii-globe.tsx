"use client";

import * as React from "react";

/**
 * Self-hosted ASCII Magic player. The runtime is a custom element that imports
 * one piece and paints it on a canvas; loading it once keeps the hero's globe
 * out of the JS bundle until the client is ready.
 */
let runtimePromise: Promise<void> | null = null;

function loadRuntime() {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("ascii-art")) return Promise.resolve();
  if (runtimePromise) return runtimePromise;

  runtimePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-ascii-runtime]",
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("ASCII runtime failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "/ascii/runtime/ascii.js";
    script.dataset.asciiRuntime = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("ASCII runtime failed to load")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return runtimePromise;
}

export function AsciiGlobe({ className = "" }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState(12);

  React.useEffect(() => {
    loadRuntime().catch(() => {
      // Decoration only; the hero still works if the runtime is unavailable.
    });
  }, []);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      const width = element.clientWidth || 0;
      const height = element.clientHeight || 0;
      // The globe is a background layer, so it is sized by both axes: wide
      // enough to sit behind the headline, short enough not to clip the hero.
      const max = width < 640 ? 8 : 18;
      const byWidth = width / 37;
      const byHeight = height > 0 ? height / 31 : Infinity;
      setSize(Math.max(6, Math.min(max, Math.floor(Math.min(byWidth, byHeight)))));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none flex select-none items-center justify-center overflow-hidden ${className}`}
    >
      {React.createElement("ascii-art", {
        piece: "wireframe-globe",
        speed: "0.55",
        size,
        style: { color: "#548bff", display: "block" },
      })}
    </div>
  );
}
