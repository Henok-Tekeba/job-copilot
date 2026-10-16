"use client";

import { ExternalLink, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeadlineBadge, RedFlagBadge } from "@/components/jobs/deadline-badge";
import { EligibilityPanel } from "@/components/jobs/eligibility-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { stripHtml } from "@/lib/jobs";
import type { Job } from "@/lib/types";

type JobDetailSheetProps = {
  job: Job | null;
  applied: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onMarkApplied: (job: Job) => void;
  onDismiss: (id: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function JobDetailSheet({
  job,
  applied,
  notes,
  onNotesChange,
  onMarkApplied,
  onDismiss,
  onOpenChange,
}: JobDetailSheetProps) {
  const plainDescription = job ? stripHtml(job.description) : "";

  return (
    <Sheet open={!!job} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col [data-side=right]:w-full sm:max-w-lg"
      >
        {job && (
          <>
            <SheetHeader className="items-start gap-2 pr-8 text-left">
              <SheetTitle className="text-base leading-snug">{job.title}</SheetTitle>
              <SheetDescription>
                {job.company || "Unknown company"} · {job.location || "No location"}
              </SheetDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <DeadlineBadge deadline={job.deadline} />
                <RedFlagBadge flags={job.evaluation.redFlags} />
                {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() =>
                    window.open(job.applyUrl || job.sourceUrl, "_blank", "noopener")
                  }
                >
                  <ExternalLink />
                  Open posting
                </Button>
                {process.env.NEXT_PUBLIC_STATIC !== "1" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={applied}
                    onClick={() => job && onMarkApplied(job)}
                  >
                    {applied ? "Applied" : "Mark applied"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onDismiss(job.id);
                    onOpenChange(false);
                  }}
                >
                  <Trash />
                  Dismiss
                </Button>
              </div>
            </SheetHeader>

            <EligibilityPanel eligibility={job.evaluation.eligibility} />

            {job.evaluation.deadlineEvidence && (
              <div className="mx-4 rounded-lg border border-border p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Deadline read from the posting
                </span>
                <p className="mt-1 text-xs">{job.evaluation.deadlineEvidence}</p>
              </div>
            )}

            <Tabs defaultValue="match" className="flex min-h-0 flex-1 flex-col px-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="match" className="flex-1">
                  Match
                </TabsTrigger>
                <TabsTrigger value="posting" className="flex-1">
                  Posting
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="match" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-3">
                {job.evaluation.fit && job.evaluation.fit.score !== null ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-3xl font-semibold tabular-nums">
                        {job.evaluation.fit.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        priority · {job.evaluation.fit.score} skill fit
                      </span>
                    </div>
                    <Progress value={job.evaluation.fit.priority} />
                    <p className="text-xs text-muted-foreground">
                      {job.evaluation.fit.reasons.join(" · ")}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not enough skills detected
                  </span>
                )}

                {job.evaluation.requiredSkills &&
                  job.evaluation.requiredSkills.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Required — you lack
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(job.evaluation.fit?.requiredMissing.length ?? 0) === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              Nothing — you meet every requirement.
                            </span>
                          ) : (
                            job.evaluation.fit?.requiredMissing.map((skill) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="border-dashed"
                              >
                                {skill}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {job.evaluation.niceToHaveSkills &&
                  job.evaluation.niceToHaveSkills.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Nice to have — you lack
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(job.evaluation.fit?.niceMissing.length ?? 0) === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              Nothing
                            </span>
                          ) : (
                            job.evaluation.fit?.niceMissing.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}

                <Separator />

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    You have
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {job.evaluation.matched.length === 0 ? (
                      <span className="text-sm text-muted-foreground">None</span>
                    ) : (
                      job.evaluation.matched.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="posting" className="min-h-0 flex-1 pt-3">
                <ScrollArea className="h-[55vh]">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {plainDescription}
                  </p>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="notes" className="flex min-h-0 flex-1 flex-col pt-3">
                <Textarea
                  placeholder="Write notes for this job..."
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  className="min-h-40 flex-1"
                />
              </TabsContent>
            </Tabs>

            <div className="px-4 pb-4">
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:underline"
              >
                {job.attribution}
              </a>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
