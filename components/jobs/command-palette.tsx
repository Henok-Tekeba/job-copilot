"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Job } from "@/lib/types";

type CommandPaletteProps = {
  jobs: Job[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (job: Job) => void;
};

export function CommandPalette({ jobs, open, onOpenChange, onSelect }: CommandPaletteProps) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search jobs"
      description="Find a job by title or company"
    >
      <CommandInput placeholder="Search title or company…" />
      <CommandList>
        <CommandEmpty>No jobs found.</CommandEmpty>
        <CommandGroup heading="Jobs">
          {jobs.map((job) => (
            <CommandItem
              key={job.id}
              value={`${job.title} ${job.company}`}
              onSelect={() => {
                onSelect(job);
                onOpenChange(false);
              }}
            >
              <SearchIcon />
              <span className="flex flex-col">
                <span className="text-sm">{job.title}</span>
                <span className="text-xs text-muted-foreground">{job.company}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
