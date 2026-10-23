"use client";

import * as React from "react";

import { companyDomain } from "@/lib/company-logo";
import { cn } from "cn";
import type { Job } from "@/lib/types";

/**
 * The company's real mark. Sources are tried in order until one loads:
 * DuckDuckGo's favicon service (404s on misses, so it is detectable), then
 * Google's 64px favicon endpoint (crisp, but returns a generic globe on a
 * miss), then the initial tile. A miss never leaves an empty or broken box.
 */
export function CompanyAvatar({ job, className }: { job: Job; className?: string }) {
  const domain = companyDomain(job);
  const sources = domain
    ? [
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      ]
    : [];
  const [stage, setStage] = React.useState(0);
  const [lastDomain, setLastDomain] = React.useState(domain);
  if (domain !== lastDomain) {
    setLastDomain(domain);
    setStage(0);
  }
  const src = stage < sources.length ? sources[stage] : null;

  return (
    <span
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white",
        !src && "bg-[#f4f4f6]",
        className,
      )}
    >
      <span className="font-mono text-xs font-semibold text-[#14141a]" aria-hidden="true">
        {(job.company || "?").slice(0, 1).toUpperCase()}
      </span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          onError={() => setStage((s) => s + 1)}
          className="absolute inset-0 size-full object-contain"
        />
      ) : null}
    </span>
  );
}
