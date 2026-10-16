import type { NormalizedJob } from "../types";

const API_URL = "https://jobicy.com/api/v2/remote-jobs?count=100&geo=anywhere";
const ATTRIBUTION = "via Jobicy";

type JobicyJob = {
  id: number;
  url: string;
  jobSlug: string;
  jobTitle: string;
  companyName: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
};

type JobicyResponse = {
  jobs: JobicyJob[];
};

export async function fetchJobicy(): Promise<NormalizedJob[]> {
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "job-copilot-collector/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Jobicy fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as JobicyResponse;

  if (!data.jobs || !Array.isArray(data.jobs)) {
    throw new Error("Jobicy: unexpected response shape");
  }

  const now = new Date().toISOString();

  return data.jobs.map((job) => ({
    id: `jobicy:${job.id}`,
    source: "jobicy" as const,
    sourceUrl: job.url,
    applyUrl: job.url,
    attribution: ATTRIBUTION,
    website: undefined,
    title: job.jobTitle,
    company: job.companyName,
    location: job.jobGeo ?? "",
    // `jobGeo` is the structured region ("USA", "Anywhere", "EMEA", "APAC").
    requiredLocation: job.jobGeo ?? undefined,
    tags: [...(job.jobIndustry ?? []), job.jobLevel ?? ""].filter(Boolean),
    // jobType is an array and already distinguishes Internship / Contract.
    jobType: (job.jobType ?? []).join(", ") || undefined,
    employmentType: job.jobType?.[0],
    description: job.jobDescription || job.jobExcerpt || "",
    postedAt: job.pubDate ? new Date(job.pubDate).toISOString() : now,
    firstSeen: now,
  }));
}
