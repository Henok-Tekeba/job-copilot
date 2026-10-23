import { SKILLS } from "./skills";
import type { Job } from "./types";

/**
 * The skill catalog for the picker. Tracks are only starting points — the
 * canonical vocabulary is SKILLS (lib/skills.ts), so every chip maps to
 * something the fit engine can actually match in posting text.
 */
export type Track = { id: string; label: string; skills: string[] };

const rawTracks: Array<Omit<Track, "skills"> & { skills: string[] }> = [
  {
    id: "frontend",
    label: "Frontend",
    skills: ["TypeScript", "JavaScript", "React", "Next.js", "Vue.js", "Angular", "Svelte", "Tailwind CSS", "HTML", "CSS", "SASS", "Redux", "Vite", "Webpack", "Figma"],
  },
  {
    id: "backend",
    label: "Backend",
    skills: ["Node.js", "TypeScript", "Python", "Java", "Golang", "Rust", "C#", "PHP", "Ruby", "Express.js", "FastAPI", "Django", "Flask", "Spring Boot", "Ruby on Rails", "Laravel", "ASP.NET", "GraphQL", "REST API", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Microservices", "System Design"],
  },
  {
    id: "data-ml",
    label: "Data & ML",
    skills: ["Python", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "PostgreSQL", "MongoDB", "Spark", "Hadoop", "Kafka", "Tableau", "Power BI", "Excel"],
  },
  {
    id: "mobile",
    label: "Mobile",
    skills: ["Swift", "Kotlin", "JavaScript", "TypeScript", "Firebase", "REST API", "Git"],
  },
  {
    id: "devops",
    label: "DevOps & SRE",
    skills: ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Linux", "Nginx", "Apache", "CI/CD", "GitHub Actions", "Jenkins", "Git", "Python", "Rust"],
  },
  {
    id: "security",
    label: "Security",
    skills: ["Linux", "Python", "Docker", "AWS", "Kubernetes", "Nginx", "CI/CD", "Git", "Rust", "Java"],
  },
  {
    id: "qa",
    label: "QA",
    skills: ["Jest", "Cypress", "Playwright", "Selenium", "Unit Testing", "TDD", "JavaScript", "TypeScript", "Python", "Jira", "Agile", "Scrum"],
  },
];

/** Only keep skills the engine can match, in a stable display order. */
export const TRACKS: Track[] = rawTracks.map(({ id, label, skills }) => ({
  id,
  label,
  skills: skills.filter((s) => s in SKILLS),
}));

/**
 * How many postings on the current snapshot touch each skill (required,
 * nice-to-have, or merely detected). Only internships/contracts count — those
 * are the only roles the board shows.
 */
export function buildDemand(jobs: Job[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const opportunity = job.evaluation.opportunity;
    if (opportunity !== "internship" && opportunity !== "contract") continue;
    // The skill lists ride along on the snapshot but are not part of the
    // declared evaluation type; read them the same way lib/profile.ts does.
    const skills = job.evaluation as unknown as {
      requiredSkills?: string[];
      niceToHaveSkills?: string[];
      detectedSkills?: string[];
    };
    const touched = new Set<string>();
    for (const s of skills.requiredSkills ?? []) touched.add(s);
    for (const s of skills.niceToHaveSkills ?? []) touched.add(s);
    for (const s of skills.detectedSkills ?? []) touched.add(s);
    for (const s of touched) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Map free-typed text to a canonical skill name when one exists. */
export function canonicalizeSkill(input: string): string | null {
  const query = input.trim().toLowerCase();
  if (!query) return null;
  for (const [canonical, aliases] of Object.entries(SKILLS)) {
    if (query === canonical.toLowerCase() || aliases.includes(query)) {
      return canonical;
    }
  }
  return null;
}
