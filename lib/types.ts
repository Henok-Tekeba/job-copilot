import { z } from "zod";

export const sourceSchema = z.enum(["remoteok", "remotive"]);
export const relevanceSchema = z.enum(["software", "other"]);
export const eligibleSchema = z.enum(["yes", "no", "unclear"]);
export const levelSchema = z.enum(["intern", "junior", "mid", "senior"]);

export const evaluationSchema = z.object({
  eligible: eligibleSchema,
  remoteReason: z.string(),
  detectedSkills: z.array(z.string()),
  matched: z.array(z.string()),
  missing: z.array(z.string()),
  fitScore: z.number().min(0).max(100).nullable(),
  level: levelSchema,
});

export const jobSchema = z.object({
  id: z.string(),
  source: sourceSchema,
  sourceUrl: z.string(),
  applyUrl: z.string().optional(),
  attribution: z.string(),
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
export type Evaluation = z.infer<typeof evaluationSchema>;
export type Job = z.infer<typeof jobSchema>;
export type SeedJob = z.infer<typeof seedJobSchema>;
export type SeedData = z.infer<typeof seedSchema>;
