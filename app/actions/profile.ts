"use server";

import { saveFacts as persistFacts, saveProfile as persistProfile } from "@/lib/store";

export async function saveProfile(data: unknown) {
  return persistProfile(data);
}

export async function saveFacts(data: unknown) {
  return persistFacts(data);
}
