import type { ReactNode } from "react";

/**
 * The ruled sheet: a white frame on a diagonally hatched stage. Sections own
 * their horizontal rules and plus markers; the shell only draws the gutters.
 */
export function SiteShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="sl-gutters">
      <div className={`sl-frame ${className}`}>{children}</div>
    </div>
  );
}
