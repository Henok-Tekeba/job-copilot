"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, TrendingUp, Database, Rss, ClipboardList, Mail, User } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarAutoClose } from "@/components/sidebar-auto-close";
import { ThemeToggle } from "@/components/theme-toggle";
import { AsciiMap } from "@/components/ascii-map";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: ClipboardList },
  { label: "Digest", href: "/digest", icon: Mail },
  { label: "Gaps", href: "/gaps", icon: TrendingUp },
  { label: "About", href: "/about", icon: User },
  { label: "Facts", href: "/facts", icon: Database },
  { label: "Sources", href: "/sources", icon: Rss },
];

const visibleNavItems =
  process.env.NEXT_PUBLIC_STATIC === "1"
    ? NAV_ITEMS.filter((item) => item.href !== "/facts")
    : NAV_ITEMS;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The landing page is the front door; the dashboard chrome starts at the
  // routes behind it.
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <SidebarAutoClose />
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="px-4 py-4">
            <div className="flex h-8 items-center gap-2">
              <span className="font-heading text-sm font-semibold tracking-tight">
                Job Copilot
              </span>
              <ThemeToggle className="ml-auto size-7" />
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                    >
                      <Icon className="ml-2" />
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
</SidebarMenu>
            </SidebarGroup>
            </SidebarContent>
        </Sidebar>
        <SidebarInset className="relative min-h-svh">
          <AsciiMap
            sweep={false}
            className="absolute inset-y-0 right-0 top-0 hidden w-max [mask-image:linear-gradient(to_bottom,black_50%,transparent_92%)] text-[9px] md:block lg:text-[12px]"
          />
          <div className="relative flex min-h-svh flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
