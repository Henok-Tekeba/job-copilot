"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { LogoMark } from "@/components/logo-mark";
import { SidebarAutoClose } from "@/components/sidebar-auto-close";
import { ThemeToggle } from "@/components/theme-toggle";
import { AsciiMap } from "@/components/ascii-map";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// The dashboard routes run TopNav chrome instead; only transitional screens
// (parked pages entered by URL) still see the sidebar.
const NAV_ITEMS = [
  { label: "Internships", href: "/jobs", icon: Briefcase, group: "Work" },
];

const visibleNavItems =
  process.env.NEXT_PUBLIC_STATIC === "1"
    ? NAV_ITEMS.filter((item) => item.href !== "/facts")
    : NAV_ITEMS;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The landing page is the front door; the dashboard chrome starts at the
  // routes behind it. Every route below runs its own TopNav chrome.
  if (
    pathname === "/" ||
    ["/jobs", "/skills", "/privacy", "/terms", "/cookies"].some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return <>{children}</>;
  }
  const groups = Array.from(new Set(visibleNavItems.map((i) => i.group)));

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <SidebarAutoClose />
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="px-4 py-5">
            <div className="flex h-9 items-center gap-2.5">
              <LogoMark className="size-[18px] text-primary" />
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">
                Shortlist
              </span>
              <ThemeToggle className="ml-auto size-7" />
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 py-2">
            {groups.map((group, gi) => (
              <React.Fragment key={group}>
                {gi > 0 && <SidebarSeparator className="my-2" />}
                <SidebarGroup>
                  <SidebarGroupLabel className="px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                    {group}
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    {visibleNavItems
                      .filter((i) => i.group === group)
                      .map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              isActive={isActive}
                              size="sm"
                              className="h-8 gap-2.5 rounded-md text-[13px] font-medium"
                              render={<Link href={item.href} />}
                            >
                              <Icon className="size-4" />
                              {item.label}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroup>
              </React.Fragment>
            ))}
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="relative min-h-svh md:rounded-3xl md:border md:border-border md:shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)]">
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