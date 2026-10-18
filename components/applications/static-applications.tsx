"use client";

import * as React from "react";
import { ClockIcon, ExternalLinkIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";

import {
  StatusDot,
  STATUS_LABELS,
} from "@/components/applications/applications-client";
import { ApplicationsCardList } from "@/components/applications/applications-card-list";
import { CalibrationPanel } from "@/components/applications/calibration-panel";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/hooks/use-mounted";
import { useTrackedJobs } from "@/hooks/use-tracked-jobs";
import { cn } from "@/lib/utils";
import type { Application, Status } from "@/lib/types";

/**
 * The applications tracker for the static site.
 *
 * The server-backed version exists for `npm run dev`; this one backs onto the
 * same localStorage database the jobs page writes to when you mark something
 * applied, so the two views agree.
 */
export function StaticApplications() {
  const tracked = useTrackedJobs();
  const today = useNow();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    company: "",
    url: "",
    appliedAt: "",
    notes: "",
  });

  const applications = tracked.applications;

  const selected = applications.find((a) => a.id === selectedId) ?? null;
  const deleteTarget = applications.find((a) => a.id === deleteId) ?? null;

  const dueCount =
    today === null
      ? null
      : applications.filter(
          (a) => a.status === "applied" && a.followUpAt <= today.toISOString().slice(0, 10)
        ).length;

  const isOverdue = (app: Application) =>
    today !== null &&
    app.status === "applied" &&
    app.followUpAt <= today.toISOString().slice(0, 10);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company) return;
    tracked.addApplication({
      title: form.title,
      company: form.company,
      url: form.url,
      appliedAt: form.appliedAt || today?.toISOString().slice(0, 10) || "",
      notes: form.notes,
    });
    setForm({ title: "", company: "", url: "", appliedAt: "", notes: "" });
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate font-heading text-base font-semibold tracking-tight sm:text-xl">
              Applications
            </h1>
            <span className="hidden text-sm whitespace-nowrap text-muted-foreground sm:inline">
              {applications.length} total
              {dueCount !== null && dueCount > 0
                ? ` · ${dueCount} follow-up${dueCount === 1 ? "" : "s"} due`
                : ""}
            </span>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="w-fit">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add application</DialogTitle>
              <DialogDescription>
                For postings you applied to outside the board.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Role title</Label>
                  <Input
                    id="title"
                    autoComplete="off"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Frontend Engineer"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="e.g. Bloomberg"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">Posting URL</Label>
                  <Input
                    id="url"
                    type="url"
                    autoComplete="url"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://…"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="appliedAt">Applied date</Label>
                  <Input
                    id="appliedAt"
                    type="date"
                    autoComplete="off"
                    value={form.appliedAt}
                    onChange={(e) => setForm((f) => ({ ...f, appliedAt: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    autoComplete="off"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes…"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <CalibrationPanel applications={applications} />

        {applications.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No applications yet</EmptyTitle>
              <EmptyDescription>
                Mark a posting as applied on the Jobs page and it will show up
                here, or add one manually.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-lg md:border md:border-border">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="font-mono text-xs">Applied</TableHead>
                    <TableHead className="font-mono text-xs">Follow-up</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(app.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="truncate font-medium max-w-xs">{app.snapshot.title}</p>
                          <p className="truncate text-xs text-muted-foreground max-w-xs">
                            {app.snapshot.company}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={app.status}
                          onValueChange={(v) =>
                            tracked.setStatus(app.id, v as Status)
                          }
                        >
                          <SelectTrigger className="w-full max-w-[140px] sm:max-w-[160px]">
                            <SelectValue>
                              {(value) => STATUS_LABELS[value as Status]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
                              <SelectItem key={status} value={status}>
                                <span className="inline-flex items-center">
                                  <StatusDot status={status} />
                                  {STATUS_LABELS[status]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {app.appliedAt}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-mono text-xs tabular-nums",
                          isOverdue(app) && "text-amber-400"
                        )}
                      >
                        {app.followUpAt}
                        {isOverdue(app) && (
                          <ClockIcon className="ml-1 inline h-3 w-3 text-amber-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="truncate max-w-xs text-sm text-muted-foreground">
                          {app.notes || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7" aria-label="Open application">
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {app.snapshot.url && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  window.open(app.snapshot.url, "_blank", "noopener")
                                }
                              >
                                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                                Open posting
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteId(app.id)}
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden">
              <ApplicationsCardList
                applications={applications}
                isOverdue={isOverdue}
                onSelect={(app) => setSelectedId(app.id)}
                onStatusChange={(id, status) => tracked.setStatus(id, status)}
              />
            </div>
          </div>
        )}

        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle>{selected.snapshot.title}</SheetTitle>
                  <SheetDescription>{selected.snapshot.company}</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sheet-notes" className="w-20">
                      Notes
                    </Label>
                    <Textarea
                      id="sheet-notes"
                      value={selected.notes}
                      onChange={(e) => tracked.setNotes(selected.id, e.target.value)}
                      rows={4}
                      placeholder="Add notes…"
                    />
                  </div>
                  <Separator />
                  <div>
                    <h4 className="mb-2 font-medium">Status history</h4>
                    <div className="flex flex-col gap-1 text-sm">
                      {selected.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <StatusDot status={h.status} />
                          <span>{STATUS_LABELS[h.status]}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {format(new Date(h.at), "yyyy-MM-dd HH:mm")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.snapshot.url && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selected.snapshot.url, "_blank", "noopener")
                        }
                      >
                        <ExternalLinkIcon className="mr-2 h-4 w-4" />
                        Open posting
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setDeleteId(selected.id)}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete application?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes &ldquo;{deleteTarget?.snapshot.title}&rdquo; from
                your tracker.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onSelect={() => {
                  if (deleteTarget) tracked.removeApplication(deleteTarget.id);
                  setSelectedId(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
