import * as fs from "fs";
import * as path from "path";
import { loadJobs, loadLastUpdated } from "@/lib/data";
import { GapsClient } from "@/components/gaps/gaps-client";

const FACTS_FILE = path.join(process.cwd(), "data", "facts.json");

function loadFacts() {
  return JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
}

const GAP_OPPORTUNITIES = new Set(["internship", "contract", "junior"]);

export default function GapsPage() {
  const jobs = loadJobs();
  const opportunities = jobs.filter(
    (j) =>
      j.relevance === "software" &&
      GAP_OPPORTUNITIES.has(j.evaluation.opportunity) &&
      (j.evaluation.eligible === "yes" || j.evaluation.eligible === "unclear")
  );

  const lastUpdated = loadLastUpdated();
  const facts = loadFacts();
  const knownSkills = (facts.skills ?? []).map((s: { name: string }) => s.name);

  return (
    <GapsClient
      initialJobs={opportunities}
      lastUpdated={lastUpdated}
      knownSkills={knownSkills}
    />
  );
}
