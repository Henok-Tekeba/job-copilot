import { getFacts, getProfile } from "@/lib/store";
import { FactsClient } from "@/components/facts/facts-client";

export async function FactsServerPage() {
  const profile = await getProfile();
  const facts = await getFacts();
  return <FactsClient initialProfile={profile} initialFacts={facts!} />;
}
