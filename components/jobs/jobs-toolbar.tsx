"use client";

import * as React from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type OpportunityFilter =
  | "focus"
  | "all"
  | "internship"
  | "contract"
  | "junior"
  | "program";
type EligibilityFilter = "open" | "all" | "no";
type SourceFilter =
  | "all"
  | "remoteok"
  | "remotive"
  | "hackernews"
  | "jobicy"
  | "manual";

export type SortBy = "priority" | "closing" | "newest";

type FilterFieldProps = {
  opportunityFilter: OpportunityFilter;
  onOpportunityFilterChange: (value: OpportunityFilter) => void;
  sourceFilter: SourceFilter;
  onSourceFilterChange: (value: SourceFilter) => void;
  eligibilityFilter: EligibilityFilter;
  onEligibilityFilterChange: (value: EligibilityFilter) => void;
  showNonSoftware: boolean;
  onShowNonSoftwareChange: (value: boolean) => void;
  minFit: number;
  onMinFitChange: (value: number) => void;
};

function FiltersFields({
  opportunityFilter,
  onOpportunityFilterChange,
  sourceFilter,
  onSourceFilterChange,
  eligibilityFilter,
  onEligibilityFilterChange,
  showNonSoftware,
  onShowNonSoftwareChange,
  minFit,
  onMinFitChange,
}: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-5">
      <ToggleGroup
        value={opportunityFilter === "focus" ? [] : [opportunityFilter]}
        onValueChange={(values) =>
          onOpportunityFilterChange(
            (values[0] as OpportunityFilter | undefined) ?? "focus"
          )
        }
        className="overflow-x-auto"
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="internship">Internship</ToggleGroupItem>
        <ToggleGroupItem value="contract">Contract</ToggleGroupItem>
        <ToggleGroupItem value="junior">Junior</ToggleGroupItem>
        <ToggleGroupItem value="program">Program</ToggleGroupItem>
      </ToggleGroup>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Eligibility</span>
        <Select
          value={eligibilityFilter}
          onValueChange={(value) => onEligibilityFilterChange(value as EligibilityFilter)}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open to me</SelectItem>
            <SelectItem value="no">Not eligible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Source</span>
        <Select
          value={sourceFilter}
          onValueChange={(value) => onSourceFilterChange(value as SourceFilter)}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="remoteok">RemoteOK</SelectItem>
            <SelectItem value="remotive">Remotive</SelectItem>
            <SelectItem value="hackernews">Hacker News</SelectItem>
            <SelectItem value="jobicy">Jobicy</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Show non-software jobs
        </span>
        <Switch checked={showNonSoftware} onCheckedChange={onShowNonSoftwareChange} size="sm" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Minimum fit
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {minFit}
          </span>
        </div>
        <Slider
          value={[minFit]}
          onValueChange={(values) => {
            const first = Array.isArray(values) ? values[0] : values;
            onMinFitChange(first ?? 0);
          }}
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}

type JobsToolbarProps = FilterFieldProps & {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
};

export function JobsToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  opportunityFilter,
  onOpportunityFilterChange,
  sourceFilter,
  onSourceFilterChange,
  eligibilityFilter,
  onEligibilityFilterChange,
  showNonSoftware,
  onShowNonSoftwareChange,
  minFit,
  onMinFitChange,
}: JobsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const filtersButton = (
    <Button variant="outline" size="sm">
      <SlidersHorizontalIcon />
      Filters
    </Button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search title or company..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <div className="hidden md:block">
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger>{filtersButton}</PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <FiltersFields
                opportunityFilter={opportunityFilter}
                onOpportunityFilterChange={onOpportunityFilterChange}
                sourceFilter={sourceFilter}
                onSourceFilterChange={onSourceFilterChange}
                eligibilityFilter={eligibilityFilter}
                onEligibilityFilterChange={onEligibilityFilterChange}
                showNonSoftware={showNonSoftware}
                onShowNonSoftwareChange={onShowNonSoftwareChange}
                minFit={minFit}
                onMinFitChange={onMinFitChange}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
          <SelectTrigger size="sm" className="w-[9.75rem]" aria-label="Sort jobs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Best match</SelectItem>
            <SelectItem value="closing">Closing soon</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>

        <div className="md:hidden">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger>{filtersButton}</SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85dvh] overflow-y-auto"
            >
              <SheetHeader className="items-start p-0 text-left">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FiltersFields
                opportunityFilter={opportunityFilter}
                onOpportunityFilterChange={onOpportunityFilterChange}
                sourceFilter={sourceFilter}
                onSourceFilterChange={onSourceFilterChange}
                eligibilityFilter={eligibilityFilter}
                onEligibilityFilterChange={onEligibilityFilterChange}
                showNonSoftware={showNonSoftware}
                onShowNonSoftwareChange={onShowNonSoftwareChange}
                minFit={minFit}
                onMinFitChange={onMinFitChange}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ToggleGroup
        value={opportunityFilter === "focus" ? [] : [opportunityFilter]}
        onValueChange={(values) =>
          onOpportunityFilterChange(
            (values[0] as OpportunityFilter | undefined) ?? "focus"
          )
        }
        className="overflow-x-auto"
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="internship">Internship</ToggleGroupItem>
        <ToggleGroupItem value="contract">Contract</ToggleGroupItem>
        <ToggleGroupItem value="junior">Junior</ToggleGroupItem>
        <ToggleGroupItem value="program">Program</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
