"use client";

import * as React from "react";

const emptySubscribe = () => () => {};

/**
 * True only after hydration.
 *
 * The site is prerendered at build time, so anything derived from the current
 * time (deadline countdowns, "closing soon" counts) must not be computed during
 * the prerender or the markup will not match the browser's. useSyncExternalStore
 * lets the server render `false` and the client swap to `true`, without a
 * setState-in-effect cascade.
 */
export function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/** Current time, or null during the prerender. */
export function useNow(): Date | null {
  const mounted = useIsMounted();
  return mounted ? new Date() : null;
}
