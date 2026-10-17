import * as fs from "fs";
import * as path from "path";
import { loadLastUpdated } from "@/lib/data";
import { GapsClient } from "@/components/gaps/gaps-client";

const FACTS_FILE = path.join(process.cwd(), "data", "facts.json");

function loadFacts() {
  return JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
}

export default function GapsPage() {
  // The job list is fetched at runtime from /jobs.json rather than serialised
  // into the HTML: inlining it made this page 3.8 MB.
  const lastUpdated = loadLastUpdated();
  const facts = loadFacts();
  const knownSkills = (facts.skills ?? []).map((s: { name: string }) => s.name);

  return <GapsClient lastUpdated={lastUpdated} knownSkills={knownSkills} />;
}
