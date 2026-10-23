"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type OpportunityFilter = "all" | "internship" | "contract";

export type SortBy = "priority" | "closing" | "newest";

const OPPORTUNITY_OPTIONS: Array<{ value: OpportunityFilter; label: string }> = [
  { value: "internship", label: "Internships" },
  { value: "contract", label: "Contract" },
];

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: "priority", label: "Best match" },
  { value: "closing", label: "Closing soon" },
  { value: "newest", label: "Newest" },
];

/**
 * The left filter rail from the reference design: a heading, a free-text
 * filter box, and collapsible check groups. Every control maps to a real
 * board filter — nothing decorative.
 */
export function BoardFilters({
  search,
  onSearchChange,
  opportunityFilter,
  onOpportunityFilterChange,
  eligibilityFilter,
  onEligibilityFilterChange,
  showNonSoftware,
  onShowNonSoftwareChange,
  sortBy,
  onSortByChange,
  minFit,
  onMinFitChange,
  profileActive,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  opportunityFilter: OpportunityFilter;
  onOpportunityFilterChange: (value: OpportunityFilter) => void;
  eligibilityFilter: "open" | "all" | "no";
  onEligibilityFilterChange: (value: "open" | "all" | "no") => void;
  showNonSoftware: boolean;
  onShowNonSoftwareChange: (value: boolean) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  minFit: number;
  onMinFitChange: (value: number) => void;
  profileActive: boolean;
}) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({
    speciality: true,
    employment: true,
    sort: true,
  });
  const toggle = (key: string) =>
    setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <aside className="flex flex-col gap-6">
      <p className="text-[15px] font-semibold text-[#14141a]">Filter</p>

      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        data-search-input
        placeholder="Company, skill, tag…"
        aria-label="Filter internships"
        className="h-10 rounded-lg border-[#e9e9ee] bg-white text-[13px] text-[#14141a] shadow-none dark:border-[#e9e9ee] dark:bg-white"
      />

      <Group
        label="Speciality"
        open={open.speciality}
        onToggle={() => toggle("speciality")}
      >
        <CheckRow
          checked={!showNonSoftware}
          onCheckedChange={(v) => onShowNonSoftwareChange(!v)}
          label="Tech roles only"
        />
        <CheckRow
          checked={eligibilityFilter === "open"}
          onCheckedChange={(v) => onEligibilityFilterChange(v ? "open" : "all")}
          label="Open to you"
        />
      </Group>

      <Group
        label="Employment"
        open={open.employment}
        onToggle={() => toggle("employment")}
      >
        {OPPORTUNITY_OPTIONS.map((option) => (
          <CheckRow
            key={option.value}
            checked={opportunityFilter === option.value}
            onCheckedChange={(v) =>
              onOpportunityFilterChange(v ? option.value : "all")
            }
            label={option.label}
          />
        ))}
      </Group>

      {profileActive ? (
        <Group label="Your match" open={open.match ?? true} onToggle={() => toggle("match")}>
          {[50, 70, 90].map((threshold) => (
            <CheckRow
              key={threshold}
              checked={minFit === threshold}
              onCheckedChange={(v) => onMinFitChange(v ? threshold : 0)}
              label={`Match ≥ ${threshold}%`}
            />
          ))}
        </Group>
      ) : null}

      <Group label="Sort" open={open.sort} onToggle={() => toggle("sort")}>
        {SORT_OPTIONS.map((option) => (
          <CheckRow
            key={option.value}
            checked={sortBy === option.value}
            onCheckedChange={(v) => v && onSortByChange(option.value)}
            label={option.label}
          />
        ))}
      </Group>

    </aside>
  );
}

function Group({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-[14px] font-semibold text-[#14141a]">{label}</span>
        {open ? (
          <ChevronUp className="size-4 text-[#5c5c64]" />
        ) : (
          <ChevronDown className="size-4 text-[#5c5c64]" />
        )}
      </button>
      {open ? <div className="mt-2 flex flex-col gap-2.5">{children}</div> : null}
    </div>
  );
}

function CheckRow({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#14141a]">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        className="size-[18px] rounded-md data-checked:border-[#2b4bf2] data-checked:bg-[#2b4bf2]"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}
