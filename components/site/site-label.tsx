import type { ReactNode } from "react";

/** The small blue-square eyebrow used at the top of every sheet section. */
export function SiteLabel({ children }: { children: ReactNode }) {
  return (
    <div className="sl-label flex items-center gap-2">
      <span className="sl-label-dot" aria-hidden="true" />
      {children}
    </div>
  );
}
