import { connection } from "next/server";
import { getApplications } from "@/lib/store";
import { ApplicationsClient } from "@/components/applications/applications-client";

export async function ApplicationsServerPage() {
  const applications = await getApplications();
  await connection();

  return (
    <ApplicationsClient initialApplications={applications} now={new Date()} />
  );
}
