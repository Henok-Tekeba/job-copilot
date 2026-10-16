import type { NormalizedJob } from "../types";

const API_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=100";
const ATTRIBUTION = "via Remotive";

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  tags: string[];
  job_type: string;
  salary: string;
  description: string;
  publication_date: string;
  url: string;
};

type RemotiveResponse = {
  jobs: RemotiveJob[];
};

export async function fetchRemotive(): Promise<NormalizedJob[]> {
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "job-copilot-collector/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Remotive fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RemotiveResponse;

  if (!data.jobs || !Array.isArray(data.jobs)) {
    throw new Error("Remotive: unexpected response shape");
  }

  const now = new Date().toISOString();

  return data.jobs.map((job) => ({
    id: `remotive:${job.id}`,
    source: "remotive" as const,
    sourceUrl: job.url,
    applyUrl: undefined,
    attribution: ATTRIBUTION,
    website: undefined,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location ?? "",
    // Keep the structured region string; the free-text form loses the list.
    requiredLocation: job.candidate_required_location ?? undefined,
    salary: job.salary || undefined,
    tags: job.tags ?? [],
    jobType: job.job_type ?? undefined,
    description: job.description ?? "",
    postedAt: new Date(job.publication_date).toISOString(),
    firstSeen: now,
  }));
}
