"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, TrendingUp, Database, Rss, ClipboardList } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarAutoClose } from "@/components/sidebar-auto-close";
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
  { label: "Jobs", href: "/", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: ClipboardList },
  { label: "Gaps", href: "/gaps", icon: TrendingUp },
  { label: "Facts", href: "/facts", icon: Database },
  { label: "Sources", href: "/sources", icon: Rss },
];

const visibleNavItems =
  process.env.NEXT_PUBLIC_STATIC === "1"
    ? NAV_ITEMS.filter(
        (item) => item.href !== "/applications" && item.href !== "/facts"
      )
    : NAV_ITEMS;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
        <SidebarInset className="min-h-svh">
          <div className="flex min-h-svh flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
