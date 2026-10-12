"use client";

import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type LevelFilter = "all" | "intern" | "junior" | "mid" | "senior";
type EligibilityFilter = "open" | "all" | "no";
type SourceFilter = "all" | "remoteok" | "remotive";

type JobsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: LevelFilter;
  onLevelFilterChange: (value: LevelFilter) => void;
  sourceFilter: SourceFilter;
  onSourceFilterChange: (value: SourceFilter) => void;
  eligibilityFilter: EligibilityFilter;
  onEligibilityFilterChange: (value: EligibilityFilter) => void;
  showNonSoftware: boolean;
  onShowNonSoftwareChange: (value: boolean) => void;
  minFit: number;
  onMinFitChange: (value: number) => void;
};

export function JobsToolbar({
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  sourceFilter,
  onSourceFilterChange,
  eligibilityFilter,
  onEligibilityFilterChange,
  showNonSoftware,
  onShowNonSoftwareChange,
  minFit,
  onMinFitChange,
}: JobsToolbarProps) {
  return (
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

      <ToggleGroup
        value={levelFilter === "all" ? [] : [levelFilter]}
        onValueChange={(values) =>
          onLevelFilterChange((values[0] as LevelFilter | undefined) ?? "all")
        }
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="intern">Intern</ToggleGroupItem>
        <ToggleGroupItem value="junior">Junior</ToggleGroupItem>
        <ToggleGroupItem value="mid">Mid</ToggleGroupItem>
        <ToggleGroupItem value="senior">Senior</ToggleGroupItem>
      </ToggleGroup>

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <SlidersHorizontalIcon />
              Filters
            </Button>
          }
        />
        <PopoverContent align="end" className="w-64">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Show non-software jobs
              </span>
              <Switch checked={showNonSoftware} onCheckedChange={onShowNonSoftwareChange} size="sm" />
            </div>

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
                </SelectContent>
              </Select>
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
