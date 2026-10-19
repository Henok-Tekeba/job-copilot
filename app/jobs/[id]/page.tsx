import { notFound } from "next/navigation";
import * as fs from "fs";
import * as path from "path";
import { JobDetailPage, type EngineVerdict } from "@/components/jobs/job-detail-page";
import { loadJobsCached } from "@/lib/data";
import { jobSchema } from "@/lib/types";
import { VERDICT_STYLE } from "@/lib/verdict-style";

/**
 * Verdicts are computed once at build time (scripts/emit-verdicts.ts) and
 * read here per page — no runtime, the export stays static.
 */
function loadVerdicts(): Map<string, EngineVerdict> {
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", "verdicts.json"), "utf-8")
    );
    return new Map(Object.entries(raw.verdicts) as Array<[string, EngineVerdict]>);
  } catch {
    return new Map();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const job = loadJobsCached().find(
    (c) => c.id === id || c.id === decoded
  );
  if (!job) return { title: "Job not found" };
  const verdict = job.evaluation.eligibility?.verdict;
  const verdictLabel = verdict ? VERDICT_STYLE[verdict].label : null;
  const desc = `${verdictLabel ? verdictLabel + ". " : ""}${job.evaluation.remoteReason}`.slice(
    0,
    200
  );
  return {
    title: `${job.title} — ${job.company}`,
    description: desc,
    openGraph: {
      title: `${job.title} at ${job.company}`,
      description: desc,
      type: "article",
    },
  };
}

/**
 * One static page per posting, so opening a posting is opening a page rather
 * than a side panel. generateStaticParams comes from the same snapshot the
 * list is built from.
 */
export function generateStaticParams() {
  return loadJobsCached().map((job) => ({ id: job.id }));
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // The router hands back the decoded segment, but the param can arrive
  // still-encoded (ids contain colons), so accept either form.
  const decoded = decodeURIComponent(id);
  const job = loadJobsCached().find(
    (candidate) => candidate.id === id || candidate.id === decoded
  );
  if (!job) return notFound();

  // Re-validate against the schema, matching what the client-side list receives.
  const parsed = jobSchema.safeParse(job);
  if (!parsed.success) return notFound();

  const verdicts = loadVerdicts();
  return <JobDetailPage job={parsed.data} verdict={verdicts.get(parsed.data.id)} />;
}
