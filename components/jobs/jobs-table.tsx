"use client";

import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { initials, relativeTime } from "@/lib/jobs";
import type { Job } from "@/lib/types";

const columnHelper = createColumnHelper<Job>();

type JobsTableProps = {
  jobs: Job[];
  loading: boolean;
  appliedIds: Set<string>;
  onRowClick: (job: Job) => void;
  onMarkApplied: (id: string) => void;
  onDismiss: (id: string) => void;
  onResetFilters: () => void;
};

export function JobsTable({
  jobs,
  loading,
  appliedIds,
  onRowClick,
  onMarkApplied,
  onDismiss,
  onResetFilters,
}: JobsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 8,
  });
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const columns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }: { table: ReturnType<typeof useReactTable<Job>> }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() as boolean)
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.accessor((row) => row.evaluation.fitScore, {
        id: "fit",
        header: "Fit",
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => {
          const score = row.original.evaluation.fitScore;
          if (score === null) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <span className="w-7 font-mono text-sm tabular-nums">{score}</span>
              <Progress value={score} className="w-14" />
            </div>
          );
        },
      }),
      columnHelper.accessor("title", {
        id: "role",
        header: "Role",
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>
                {initials(row.original.company || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {row.original.title}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {row.original.company || "Unknown company"}
              </span>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.evaluation.opportunity, {
        id: "opportunity",
        header: "Opportunity",
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.evaluation.opportunity}
          </Badge>
        ),
      }),
      {
        id: "remote",
        header: "Remote",
        enableSorting: false,
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => {
          const eligible = row.original.evaluation.eligible;
          return (
            <Tooltip>
              <TooltipTrigger>
                <span className="flex size-4 items-center justify-center">
                  {eligible === "yes" && (
                    <span className="size-2 rounded-full bg-emerald-500" />
                  )}
                  {eligible === "unclear" && (
                    <span className="size-2 rounded-full border border-amber-500" />
                  )}
                  {eligible === "no" && <span className="size-2" />}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.evaluation.remoteReason || "No info"}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      columnHelper.accessor("source", {
        id: "source",
        header: "Source",
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => (
          <Badge variant="secondary">
            {row.original.source === "remoteok"
              ? "RemoteOK"
              : row.original.source === "hackernews"
                ? "Hacker News"
                : row.original.source === "manual"
                  ? "Manual"
                  : "Remotive"}
          </Badge>
        ),
      }),
      columnHelper.accessor("postedAt", {
        id: "posted",
        header: "Posted",
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {row.original.postedAt
              ? relativeTime(row.original.postedAt, now)
              : "—"}
          </span>
        ),
      }),
      {
        id: "missing",
        header: "Missing",
        enableSorting: false,
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => {
          const missing = row.original.evaluation.missing;
          if (missing.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="flex items-center gap-1">
              {missing.slice(0, 2).map((skill: string) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
              {missing.length > 2 && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Badge variant="outline">+{missing.length - 2}</Badge>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className="flex flex-wrap gap-1">
                      {missing.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }: { row: import("@tanstack/table-core").Row<Job> }) => {
          const job = row.original;
          const applied = appliedIds.has(job.id);
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      window.open(job.applyUrl || job.sourceUrl, "_blank", "noopener")
                    }
                  >
                    Open posting
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={applied}
                    onSelect={() => onMarkApplied(job.id)}
                  >
                    {applied ? "Applied" : "Mark applied"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDismiss(job.id)}
                  >
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [appliedIds, onDismiss, onMarkApplied],
  );

  const table = useReactTable({
    data: jobs,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-2 py-3">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No jobs match your filters</EmptyTitle>
          <EmptyDescription>
            Try widening the search or lowering the minimum fit score.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? (
                        <ArrowUp />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ArrowDown />
                      ) : (
                        <ArrowUpDown />
                      )}
                    </Button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className="cursor-pointer"
              onClick={() => onRowClick(row.original)}
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <Button
              key={i}
              variant={table.getState().pagination.pageIndex === i ? "outline" : "ghost"}
              size="icon-sm"
              className="h-7 w-7 font-mono text-xs tabular-nums"
              onClick={() => table.setPageIndex(i)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
