import { z } from "zod";

export const SourceSchema = z.enum(["remoteok", "remotive", "hackernews"]);

export const NormalizedJobSchema = z.object({
  id: z.string(),
  source: SourceSchema,
  sourceUrl: z.string(),
  applyUrl: z.string().optional(),
  attribution: z.string(),
  website: z.string().optional(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  tags: z.array(z.string()),
  jobType: z.string().optional(),
  description: z.string(),
  postedAt: z.string(),
  firstSeen: z.string(),
});

export type Source = z.infer<typeof SourceSchema>;
export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;
