import JobsPage from "@/components/jobs/jobs-page";

/**
 * The list fetches its data at runtime from `/jobs.json` (emitted by
 * `npm run build`), rather than receiving it as props.
 *
 * Passing the postings in serialised the whole dataset into the HTML — 4,000
 * jobs made `index.html` 17 MB. The shell now prerenders small and the data
 * arrives as a cacheable, compressible asset.
 */
export default function Home() {
  return <JobsPage />;
}
