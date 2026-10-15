import { z } from "zod";

export const sourceSchema = z.enum(["remoteok", "remotive", "hackernews", "manual"]);
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

export const evaluationSchema = z.object({
  eligible: eligibleSchema,
  remoteReason: z.string(),
  detectedSkills: z.array(z.string()),
  matched: z.array(z.string()),
  missing: z.array(z.string()),
  fitScore: z.number().min(0).max(100).nullable(),
  level: levelSchema,
  opportunity: opportunitySchema,
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
