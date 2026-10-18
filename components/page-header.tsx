"use client";

import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Top bar shared by every screen.
 *
 * It always renders the SidebarTrigger. On mobile the sidebar is an off-canvas
 * sheet, so a screen without this header has no way back to the navigation.
 */
export function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="hidden h-6 md:block" />
      {children}
    </header>
  );
}
