"use client";

import * as React from "react";
import { ExternalLinkIcon, PlusIcon, Trash2Icon, ClockIcon } from "lucide-react";

import { ApplicationsCardList } from "@/components/applications/applications-card-list";
import { Button } from "@/components/ui/button";
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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { format } from "date-fns";
import type { Application, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<Status, string> = {
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

export function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full inline-block mr-1.5 align-middle",
        STATUS_DOT_COLORS[status]
      )}
    />
  );
}

export function StatusText({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center text-sm">
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ApplicationsClient({
  initialApplications,
  now,
}: {
  initialApplications: Application[];
  now: Date;
}) {
  const [applications, setApplications] = React.useState<Application[]>(initialApplications);
  const [selectedApp, setSelectedApp] = React.useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    company: "",
    url: "",
    appliedAt: now.toISOString().slice(0, 10),
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const dueCount = React.useMemo(() => {
    return applications.filter((a) => a.status === "applied" && new Date(a.followUpAt) <= now).length;
  }, [applications, now]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<Status, number> = {
      applied: 0,
      replied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      ghosted: 0,
    };
    for (const a of applications) counts[a.status]++;
    return counts;
  }, [applications]);

  const handleStatusChange = async (id: string, status: Status) => {
    const res = await fetch("/api/applications/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
  };

  const handleNotesChange = async (id: string, notes: string) => {
    await fetch("/api/applications/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes }),
    });
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, notes } : a)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/applications/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const created = await res.json();
      setApplications((prev) => [created, ...prev]);
      setDialogOpen(false);
      setFormData({ title: "", company: "", url: "", appliedAt: new Date().toISOString().slice(0, 10), notes: "" });
    }
    setIsSubmitting(false);
  };

  const formatDate = (iso: string) => format(new Date(iso), "yyyy-MM-dd");

  const isOverdue = (app: Application) =>
    app.status === "applied" && new Date(app.followUpAt) <= now;

  return (
    <>
      <PageHeader>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate font-heading text-base font-semibold tracking-tight sm:text-xl">Applications</h1>
            <span className="hidden text-sm whitespace-nowrap text-muted-foreground sm:inline">
              {applications.length} total · {dueCount} follow-up{dueCount !== 1 ? "s" : ""} due
            </span>
          </div>
          <div className="hidden flex-wrap items-center gap-2 text-xs text-muted-foreground md:flex">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="flex items-center gap-1 whitespace-nowrap">
                <StatusText status={status as Status} />
                <span className="font-mono tabular-nums">: {count}</span>
              </span>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="w-fit"><PlusIcon className="mr-2 h-4 w-4" />Add application</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add application</DialogTitle>
              <DialogDescription>For jobs not tracked in the Jobs board.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Role title</Label>
                  <Input
                    id="title"
                    autoComplete="off"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Frontend Engineer"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    autoComplete="organization"
                    value={formData.company}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">Posting URL</Label>
                  <Input
                    id="url"
                    type="url"
                    autoComplete="url"
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://…"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="appliedAt">Applied date</Label>
                  <Input
                    id="appliedAt"
                    type="date"
                    autoComplete="off"
                    value={formData.appliedAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, appliedAt: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    autoComplete="off"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes…"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding…" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {applications.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center sm:p-12">
            <p className="text-muted-foreground">No applications yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Click &ldquo;Add application&rdquo; or mark a job as applied from the Jobs board.</p>
          </div>
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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-xs">{app.snapshot.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{app.snapshot.company}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Select
                        value={app.status}
                        onValueChange={(v) => handleStatusChange(app.id, v as Status)}
                      >
                        <SelectTrigger className="max-w-[140px] w-full sm:max-w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value]) => (
                            <SelectItem key={value} value={value}>
                              <StatusText status={value as Status} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDate(app.appliedAt)}
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs tabular-nums", isOverdue(app) && "text-amber-400")}>
                      {formatDate(app.followUpAt)}
                      {isOverdue(app) && <ClockIcon className="ml-1 inline h-3 w-3 text-amber-400" />}
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
                          <DropdownMenuItem
                            onSelect={() => window.open(app.snapshot.url, "_blank", "noopener")}
                          >
                            <ExternalLinkIcon className="mr-2 h-4 w-4" />
                            Open posting
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteTarget(app)}
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
                onSelect={setSelectedApp}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}


        <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg">
            {selectedApp && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedApp.snapshot.title}</SheetTitle>
                  <SheetDescription>{selectedApp.snapshot.company}</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="notes" className="w-20">Notes</Label>
                    <Textarea
                      id="notes"
                      value={selectedApp.notes}
                      onChange={(e) => handleNotesChange(selectedApp.id, e.target.value)}
                      rows={4}
                      placeholder="Add notes…"
                      />
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Status history</h4>
                    <div className="flex flex-col gap-1 text-sm">
                      {selectedApp.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <StatusText status={h.status} />
                          <span className="font-mono text-xs text-muted-foreground">
                            {format(new Date(h.at), "yyyy-MM-dd HH:mm")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedApp.snapshot.url, "_blank", "noopener")}
                    >
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      Open posting
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(selectedApp)}
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

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete application?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove &ldquo;{deleteTarget?.snapshot.title}&rdquo; from your tracker.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onSelect={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}