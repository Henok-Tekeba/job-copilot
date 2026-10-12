import JobsPage from "@/components/jobs/jobs-page";
import { loadJobs } from "@/lib/data";

export default function Home() {
  const jobs = loadJobs();
  return <JobsPage initialJobs={jobs} />;
}
