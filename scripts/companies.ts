import * as fs from "fs";
import * as path from "path";
import { AtsSchema, type Ats } from "./types";

const COMPANIES_FILE = path.join(process.cwd(), "data", "companies.json");

export type Company = {
  name: string;
  ats: Ats;
  token: string;
};

/**
 * The verified ATS board list, produced by `npm run discover`.
 *
 * Collection depends on this file, so an unreadable or invalid list is a hard
 * error rather than an empty result: silently collecting nothing would look
 * like "no jobs today" and hide a broken deployment.
 */
export function loadCompanies(): Company[] {
  if (!fs.existsSync(COMPANIES_FILE)) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), COMPANIES_FILE)}. Run: npm run discover`
    );
  }

  const raw: unknown = JSON.parse(fs.readFileSync(COMPANIES_FILE, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("data/companies.json must be an array");
  }

  const companies: Company[] = [];
  for (const entry of raw) {
    const candidate = entry as Partial<Company>;
    const ats = AtsSchema.safeParse(candidate.ats);
    if (
      typeof candidate.name !== "string" ||
      typeof candidate.token !== "string" ||
      !ats.success
    ) {
      throw new Error(
        `Invalid entry in data/companies.json: ${JSON.stringify(entry)}`
      );
    }
    companies.push({ name: candidate.name, ats: ats.data, token: candidate.token });
  }

  return companies;
}

export function companiesFor(ats: Ats): Company[] {
  return loadCompanies().filter((company) => company.ats === ats);
}
