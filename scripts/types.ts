import { z } from "zod";

export const AtsSchema = z.enum(["greenhouse", "lever", "ashby"]);
export type Ats = z.infer<typeof AtsSchema>;

export const SourceSchema = z.union([
  z.enum(["remoteok", "remotive", "hackernews", "jobicy"]),
  AtsSchema,
]);

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
  /**
   * Structured eligibility/region string exactly as the feed published it.
   * Remotive calls this `candidate_required_location`, Jobicy calls it `jobGeo`.
   * Preserved because it is the only reliable eligibility signal we get.
   */
  requiredLocation: z.string().optional(),
  /** Pay text as published, when the feed provides it. */
  salary: z.string().optional(),
  /** Structured employment type, e.g. Ashby's "Intern" / "Contract". */
  employmentType: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;
export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;

