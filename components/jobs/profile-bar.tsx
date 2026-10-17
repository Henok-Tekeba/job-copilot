"use client";

import * as React from "react";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ALL_SKILLS } from "@/lib/profile";
import type { Profile } from "@/lib/profile";

type ProfileBarProps = {
  profile: Profile;
  onToggleSkill: (skill: string) => void;
  onSetSkills: (skills: string[]) => void;
  onSetActive: (active: boolean) => void;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
};

/**
 * The visitor's own skill set, as a first-class object on the board.
 *
 * When empty, the board is scored against the default profile and this bar
 * invites the visitor to make it theirs. When set, it states plainly whose
 * fit is on screen, so a visitor never confuses the author's scores with
 * their own.
 */
export function ProfileBar({
  profile,
  onToggleSkill,
  onSetSkills,
  onSetActive,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: ProfileBarProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = sheetOpenProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onSheetOpenChange) onSheetOpenChange(v);
    else setInternalOpen(v);
  };
  const [query, setQuery] = React.useState("");

  const active = profile.active && profile.skills.length > 0;
  const filtered = query
    ? ALL_SKILLS.filter((s) =>
        s.toLowerCase().includes(query.trim().toLowerCase())
      )
    : ALL_SKILLS;

  return (
    <div className="flex flex-col gap-3 border-y border-border py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {active
            ? `Showing fit for you · ${profile.skills.length} skill${
                profile.skills.length === 1 ? "" : "s"
              }`
            : "Showing fit for the default profile"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetActive(false)}
              className="text-muted-foreground"
            >
              Use default
            </Button>
          )}
          <Button
            variant={active ? "outline" : "default"}
            size="sm"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontalIcon />
            {active ? "Edit profile" : "Add your skills"}
          </Button>
        </div>
      </div>

      {active && (
        <div className="flex flex-wrap gap-1.5">
          {profile.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => onToggleSkill(skill)}
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${skill}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {!active && (
        <p className="text-xs text-muted-foreground">
          Add your skills to see your own fit and the skills you are missing,
          instead of the default profile.
        </p>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="items-start p-0 text-left">
            <SheetTitle>Your skills</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search skills…"
                  className="pl-8"
                />
              </div>
              {profile.skills.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetSkills([])}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>

            <ToggleGroup
              value={profile.skills}
              onValueChange={(values) => onSetSkills(values as string[])}
              multiple
              className="flex flex-wrap gap-1.5"
            >
              {filtered.map((skill) => (
                <ToggleGroupItem
                  key={skill}
                  value={skill}
                  size="sm"
                  className="h-7"
                >
                  {skill}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No skills match “{query}”.
              </p>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {profile.skills.length} selected
              </span>
              <Button
                onClick={() => {
                  if (profile.skills.length > 0) onSetActive(true);
                  setOpen(false);
                }}
                disabled={profile.skills.length === 0}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
