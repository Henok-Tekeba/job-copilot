import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import {
  applicationSchema,
  type Application,
  type ApplicationSnapshot,
  type Status,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const FACTS_FILE = path.join(DATA_DIR, "facts.json");

const profileSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  timezone: z.string(),
  links: z.object({
    github: z.string(),
    linkedin: z.string(),
    website: z.string(),
  }),
  education: z.object({
    school: z.string(),
    program: z.string(),
    expectedGraduation: z.string(),
  }),
  summaries: z.object({
    oneLine: z.string(),
    short: z.string(),
    long: z.string(),
  }),
  availability: z.string(),
  answers: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      answer: z.string(),
    })
  ),
});

const projectSchema = z.object({
  id: z.string(),
  summary: z.string(),
  tech: z.array(z.string()),
  link: z.string(),
  bullets: z.array(z.string()),
});

const factsSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      evidence: z.array(z.string()),
    })
  ),
  projects: z.array(projectSchema),
});

type Profile = z.infer<typeof profileSchema>;

function ensureApplicationsFile() {
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    fs.writeFileSync(APPLICATIONS_FILE, "[]");
  }
}

function loadApplications(): Application[] {
  ensureApplicationsFile();
  const raw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
  const parsed = applicationSchema.array().safeParse(JSON.parse(raw));
  if (!parsed.success) return [];
  return parsed.data;
}

function saveApplications(apps: Application[]) {
  ensureApplicationsFile();
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(apps, null, 2));
}

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getApplications(): Promise<Application[]> {
  return loadApplications();
}

export async function createApplication(input: {
  jobId: string | null;
  snapshot: ApplicationSnapshot;
  appliedAt: string;
  notes?: string;
}): Promise<Application> {
  const apps = loadApplications();
  const now = new Date().toISOString();
  const followUpAt = new Date(new Date(input.appliedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const app: Application = {
    id: generateId(),
    jobId: input.jobId,
    snapshot: input.snapshot,
    appliedAt: input.appliedAt,
    status: "applied",
    followUpAt,
    notes: input.notes ?? "",
    statusHistory: [{ status: "applied", at: now }],
  };

  apps.unshift(app);
  saveApplications(apps);
  return app;
}

export async function updateApplicationStatus(id: string, status: Status): Promise<Application | null> {
  const apps = loadApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  apps[idx] = {
    ...apps[idx],
    status,
    statusHistory: [...apps[idx].statusHistory, { status, at: now }],
  };
  saveApplications(apps);
  return apps[idx];
}

export async function updateApplicationNotes(id: string, notes: string): Promise<Application | null> {
  const apps = loadApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  apps[idx] = { ...apps[idx], notes };
  saveApplications(apps);
  return apps[idx];
}

export async function deleteApplication(id: string): Promise<boolean> {
  const apps = loadApplications();
  const filtered = apps.filter((a) => a.id !== id);
  if (filtered.length === apps.length) return false;
  saveApplications(filtered);
  return true;
}

function ensureProfileExists() {
  if (!fs.existsSync(PROFILE_FILE)) {
    const empty: Profile = {
      name: "",
      email: "",
      phone: "",
      location: "",
      timezone: "",
      links: { github: "", linkedin: "", website: "" },
      education: { school: "", program: "", expectedGraduation: "" },
      summaries: { oneLine: "", short: "", long: "" },
      availability: "",
      answers: [],
    };
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(empty, null, 2));
  }
}

export async function getProfile(): Promise<Profile> {
  ensureProfileExists();
  const raw = fs.readFileSync(PROFILE_FILE, "utf-8");
  return profileSchema.parse(JSON.parse(raw));
}

export async function saveProfile(data: unknown): Promise<{ ok: true }> {
  const parsed = profileSchema.parse(data);
  ensureProfileExists();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(parsed, null, 2));
  return { ok: true as const };
}

export async function getFacts() {
  if (!fs.existsSync(FACTS_FILE)) return null;
  const raw = fs.readFileSync(FACTS_FILE, "utf-8");
  return factsSchema.parse(JSON.parse(raw));
}

export async function saveFacts(data: unknown): Promise<{ ok: true }> {
  const parsed = factsSchema.parse(data);
  fs.writeFileSync(FACTS_FILE, JSON.stringify(parsed, null, 2));
  return { ok: true as const };
}
