/**
 * Engine enums are lowercase machine values (`fulltime`, `remote`, `ashby`);
 * the UI speaks English with a capital first letter. One map, used everywhere,
 * so a raw value can never leak onto the page again.
 */
const OPPORTUNITY_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  internship: "Internship",
  junior: "Junior",
  contract: "Contract",
  program: "Program",
  entry: "Entry-level",
  focus: "Internships & entry",
};

const WORKPLACE_LABELS: Record<string, string> = {
  remote: "Remote",
  onsite: "On-site",
  hybrid: "Hybrid",
};

export const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

/** Chip-safe label — empty string hides the chip. */
export const opportunityLabel = (value?: string | null) =>
  value ? (OPPORTUNITY_LABELS[value] ?? cap(value)) : "";

export const workplaceLabel = (value?: string | null) => {
  if (!value || value === "unknown") return "";
  return WORKPLACE_LABELS[value] ?? cap(value);
};
