"use client";

import { ClockIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Application, Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_LABELS: Record<Status, string> = {
  applied: "Applied",
  replied: "Replied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
};

const STATUS_DOT_COLORS: Record<Status, string> = {
  applied: "bg-blue-400",
  replied: "bg-cyan-400",
  interview: "bg-amber-400",
  offer: "bg-emerald-400",
  rejected: "bg-red-400",
  ghosted: "bg-muted-foreground",
};

function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-block mr-1.5 h-2 w-2 rounded-full align-middle",
        STATUS_DOT_COLORS[status]
      )}
    />
  );
}

type ApplicationsCardListProps = {
  applications: Application[];
  isOverdue: (app: Application) => boolean;
  onSelect: (app: Application) => void;
  onStatusChange: (id: string, status: Status) => void;
};

function ApplicationCard({
  app,
  overdue,
  onSelect,
  onStatusChange,
}: {
  app: Application;
  overdue: boolean;
  onSelect: (app: Application) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      className="cursor-pointer"
      onClick={() => onSelect(app)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(app);
        }
      }}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm leading-snug font-medium text-foreground">
              {app.snapshot.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {app.snapshot.company}
            </span>
          </div>
          <div
            className="flex shrink-0 items-center gap-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Select
              value={app.status}
              onValueChange={(v) => onStatusChange(app.id, v as Status)}
            >
              <SelectTrigger className="w-full min-w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value]) => (
                  <SelectItem key={value} value={value}>
                    <StatusDot status={value as Status} />
                    {STATUS_LABELS[value as Status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
          <span>Applied {format(new Date(app.appliedAt), "yyyy-MM-dd")}</span>
          <span className={cn(overdue && "text-amber-400")}>
            Follow-up {format(new Date(app.followUpAt), "yyyy-MM-dd")}
            {overdue && <ClockIcon className="ml-1 inline h-3 w-3" />}
          </span>
        </div>

        {app.notes && (
          <p className="truncate text-xs text-muted-foreground">{app.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ApplicationsCardList({
  applications,
  isOverdue,
  onSelect,
  onStatusChange,
}: ApplicationsCardListProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          overdue={isOverdue(app)}
          onSelect={onSelect}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
