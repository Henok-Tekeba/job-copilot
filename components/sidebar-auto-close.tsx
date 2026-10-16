"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { useSidebar } from "@/components/ui/sidebar";

/**
 * On mobile the sidebar renders as an off-canvas sheet. Tapping a nav link
 * changes the route but leaves that sheet covering the new page, so close it
 * whenever the pathname changes.
 */
export function SidebarAutoClose() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  return null;
}
