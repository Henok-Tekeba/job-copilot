import { z } from "zod";

export const sourceSchema = z.enum(["remoteok", "remotive", "hackernews", "jobicy", "manual"]);
export const relevanceSchema = z.enum(["software", "other"]);
export const eligibleSchema = z.enum(["yes", "no", "unclear"]);
export const levelSchema = z.enum(["intern", "junior", "mid", "senior"]);
export const opportunitySchema = z.enum([
  "internship",
  "contract",
  "junior",
  "program",
  "fulltime",
]);

export const regionSchema = z.enum([
  "worldwide",
  "africa",
  "europe",
  "north-america",
  "latam",
  "apac",
  "middle-east",
  "cis",
]);

export const eligibilityVerdictSchema = z.enum([
  "open",
  "region-locked",
  "conflict",
  "unknown",
]);

export const eligibilitySchema = z.object({
  verdict: eligibilityVerdictSchema,
  africaOpen: z.boolean(),
  regions: z.array(regionSchema),
  regionLabels: z.array(z.string()),
  evidence: z.array(z.object({ field: z.string(), value: z.string() })),
  unknownSegments: z.array(z.string()),
  timezone: z.object({
    band: z.enum(["americas", "europe-africa", "apac"]).nullable(),
    required: z.string().nullable(),
    overlapsAfrica: z.boolean().nullable(),
  }),
  blockedBy: z.string().nullable(),
  summary: z.string(),
});

export const fitSchema = z.object({
  score: z.number().nullable(),
  priority: z.number(),
  coverage: z.number(),
  requiredMatched: z.array(z.string()),
  requiredMissing: z.array(z.string()),
  niceMatched: z.array(z.string()),
  niceMissing: z.array(z.string()),
  levelWeight: z.number(),
  eligibilityWeight: z.number(),
  basis: z.enum(["required", "detected"]),
  reasons: z.array(z.string()),
});

export const evaluationSchema = z.object({
  eligible: eligibleSchema,
  remoteReason: z.string(),
  detectedSkills: z.array(z.string()),
  matched: z.array(z.string()),
  missing: z.array(z.string()),
  fitScore: z.number().min(0).max(100).nullable(),
  level: levelSchema,
  opportunity: opportunitySchema,
  // Added when eligibility became evidence-based. Optional so data collected
  // before the change still validates instead of silently falling back to seed.
  eligibility: eligibilitySchema.optional(),
  fit: fitSchema.optional(),
  requiredSkills: z.array(z.string()).optional(),
  niceToHaveSkills: z.array(z.string()).optional(),
  deadlineEvidence: z.string().nullable().optional(),
  /** Unpaid / commission-only / fee-requesting signals worth warning about. */
  redFlags: z.array(z.string()).optional(),
});

export const programSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
  opportunity: z.literal("program"),
  eligible: eligibleSchema,
  deadline: z.string().nullable(),
  notes: z.string(),
});

export const statusSchema = z.enum(["applied", "replied", "interview", "offer", "rejected", "ghosted"]);

export const statusHistorySchema = z.object({
  status: statusSchema,
  at: z.string(),
});

export const applicationSnapshotSchema = z.object({
  title: z.string(),
  company: z.string(),
  url: z.string(),
  source: z.string(),
});

export const applicationSchema = z.object({
  id: z.string(),
  jobId: z.string().nullable(),
  snapshot: applicationSnapshotSchema,
  appliedAt: z.string(),
  status: statusSchema,
  followUpAt: z.string(),
  notes: z.string(),
  statusHistory: z.array(statusHistorySchema),
});

export const jobSchema = z.object({
  id: z.string(),
  source: sourceSchema,
  sourceUrl: z.string(),
  applyUrl: z.string().optional(),
  attribution: z.string(),
  website: z.string().optional(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  postedAt: z.string(),
  firstSeen: z.string(),
  relevance: relevanceSchema,
  evaluation: evaluationSchema,
  /** Structured region string straight from the feed, when it provides one. */
  requiredLocation: z.string().optional(),
  /** Application cutoff, ISO date. */
  deadline: z.string().nullable().optional(),
  /** Pay text as published, when the feed provides it. */
  salary: z.string().optional(),
});

export const seedJobSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceName: z.string(),
  type: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote: z.string(),
  remoteReason: z.string(),
  postedAt: z.string(),
  deadline: z.string().nullable(),
  applyMethod: z.string(),
  applyUrl: z.string(),
  description: z.string(),
  requiredSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  evaluation: z.object({
    eligible: z.boolean().nullable(),
    fitScore: z.number(),
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    summary: z.string(),
  }),
});

export const seedSchema = z.object({
  me: z.object({
    skills: z.array(z.string()),
  }),
  jobs: z.array(seedJobSchema),
});

export type Source = z.infer<typeof sourceSchema>;
export type Relevance = z.infer<typeof relevanceSchema>;
export type Eligible = z.infer<typeof eligibleSchema>;
export type Region = z.infer<typeof regionSchema>;
export type EligibilityVerdict = z.infer<typeof eligibilityVerdictSchema>;
export type Eligibility = z.infer<typeof eligibilitySchema>;
export type FitBreakdown = z.infer<typeof fitSchema>;
export type Level = z.infer<typeof levelSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type Evaluation = z.infer<typeof evaluationSchema>;
export type Job = z.infer<typeof jobSchema>;
export type SeedJob = z.infer<typeof seedJobSchema>;
export type SeedData = z.infer<typeof seedSchema>;
export type Program = z.infer<typeof programSchema>;
export type Status = z.infer<typeof statusSchema>;
export type StatusHistory = z.infer<typeof statusHistorySchema>;
export type ApplicationSnapshot = z.infer<typeof applicationSnapshotSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type Project = {
  id: string;
  summary: string;
  tech: string[];
  link: string;
  bullets: string[];
};
