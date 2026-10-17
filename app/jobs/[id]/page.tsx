import { notFound } from "next/navigation";
import { JobDetailPage } from "@/components/jobs/job-detail-page";
import { loadJobsCached } from "@/lib/data";
import { jobSchema } from "@/lib/types";

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

  return <JobDetailPage job={parsed.data} />;
}
