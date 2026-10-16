import type { NormalizedJob } from "../types";

const API_URL = "https://remoteok.com/api";
const ATTRIBUTION = "via RemoteOK";

type RemoteOKJob = {
  id: string;
  position: string;
  company: string;
  location: string;
  tags: string[];
  description: string;
  date: string;
  url: string;
  apply_url: string;
  salary_min: number;
  salary_max: number;
};

function formatSalary(job: RemoteOKJob): string | undefined {
  const min = job.salary_min ?? 0;
  const max = job.salary_max ?? 0;
  if (!min && !max) return undefined;
  const usd = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${usd(min)} - ${usd(max)}`;
  return usd(min || max);
}

export async function fetchRemoteOK(): Promise<NormalizedJob[]> {
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "job-copilot-collector/1.0" },
  });

  if (!res.ok) {
    throw new Error(`RemoteOK fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as unknown[];

  if (!Array.isArray(data) || data.length < 2) {
    throw new Error("RemoteOK: unexpected response shape");
  }

  const jobs = data.slice(1) as RemoteOKJob[];

  const now = new Date().toISOString();

  return jobs.map((job) => ({
    id: `remoteok:${job.id}`,
    source: "remoteok" as const,
    sourceUrl: job.url,
    applyUrl: job.apply_url,
    attribution: ATTRIBUTION,
    website: undefined,
    title: job.position,
    company: job.company,
    location: job.location ?? "",
    // RemoteOK has no structured region field; the location string is all we get.
    requiredLocation: undefined,
    salary: formatSalary(job),
    tags: job.tags ?? [],
    jobType: undefined,
    description: job.description ?? "",
    postedAt: new Date(job.date).toISOString(),
    firstSeen: now,
  }));
}
