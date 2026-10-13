import type { NormalizedJob } from "../types";

const SEARCH_URL =
  "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=who%20is%20hiring&hitsPerPage=5";
const ATTRIBUTION = "via Hacker News";

type HNHit = {
  objectID: string;
  title: string;
  created_at: string;
};

type HNItem = {
  id: number;
  type: string;
  text: string | null;
  parent_id: number;
  children?: HNItem[];
  created_at: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x3D;/g, "=")
    .replace(/&#x60;/g, "`")
    .replace(/&#x2B;/g, "+")
    .replace(/&#37;/g, "%")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function htmlToPlainText(html: string): string {
  let text = html;
  text = text.replace(/<p>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>.*?<\/a>/gi, "$1");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeHtmlEntities(text);
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();
  return text;
}

function extractFirstUrl(text: string): string {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/g;
  const match = text.match(urlRegex);
  if (match) {
    for (const url of match) {
      if (!url.includes("news.ycombinator.com")) {
        return url;
      }
    }
  }
  return "";
}

function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const match = text.match(emailRegex);
  if (match) {
    return "mailto:" + match[0];
  }
  return "";
}

function isUrlOrDomain(segment: string): boolean {
  const lower = segment.toLowerCase().trim();
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("www.") ||
    /^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/.test(lower)
  );
}

function isEmploymentType(segment: string): boolean {
  const lower = segment.toLowerCase().trim();
  return (
    lower === "full-time" ||
    lower === "part-time" ||
    lower === "contract" ||
    lower === "ft" ||
    lower === "pt" ||
    lower === "full time" ||
    lower === "part time" ||
    lower.includes("multiple roles") ||
    lower.includes("multiple locations")
  );
}

function containsRoleKeywords(segment: string): boolean {
  const lower = segment.toLowerCase();
  const keywords = [
    "engineer",
    "developer",
    "designer",
    "intern",
    "manager",
    "scientist",
    "swe",
    "founding",
    "software",
  ];
  return keywords.some((k) => lower.includes(k));
}

function isCompanyValid(company: string): boolean {
  if (!company || company === "Unknown") return false;
  const lower = company.toLowerCase();
  const roleWords = ["engineer", "developer", "designer", "manager", "scientist"];
  return !roleWords.some((w) => lower.includes(w));
}

function parseHeader(
  firstLine: string
): { company: string; title: string; location: string; website: string } {
  let segments = firstLine.split("|").map((s) => s.trim()).filter(Boolean);

  if (segments.length < 2) {
    segments = firstLine
      .split(/\s+[–—]\s+|\s+-\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (segments.length < 2) {
    return { company: "Unknown", title: "Hiring (see posting)", location: "", website: "" };
  }

  let website = "";
  const filtered: string[] = [];
  for (const seg of segments) {
    if (!website && isUrlOrDomain(seg)) {
      website = seg;
    } else {
      filtered.push(seg);
    }
  }

  const candidates = filtered.filter((s) => !isEmploymentType(s));

  let company = candidates[0] || "Unknown";
  company = company.replace(/\([^)]*\)/g, "").trim();
  company = company.split(/\s+[–—]\s+/)[0].trim();
  if (isUrlOrDomain(company)) {
    const bare = company.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    company = bare;
  }
  if (!isCompanyValid(company)) {
    company = "Unknown";
  }

  const titleSeg = candidates.find((s) => containsRoleKeywords(s) && !isUrlOrDomain(s));
  const title = titleSeg || "Hiring (see posting)";

  const parentheticalRegion = extractParentheticalRegion(firstLine);
  const locationSeg =
    candidates.find(
      (s) =>
        s !== company &&
        s !== title &&
        containsLocationKeyword(s) &&
        !isEmploymentType(s) &&
        !isUrlOrDomain(s)
    ) || "";

  const location = locationSeg || parentheticalRegion || "";

  return { company, title, location, website };
}

function extractParentheticalRegion(text: string): string {
  const match = text.match(/\((?:[^()]*?(?:remote|onsite|on-site|hybrid|global|worldwide|us|usa|uk|eu|canada|australia|germany|france|netherlands|india|japan|brazil|mexico|singapore|remote\s+\w+)[^()]*?)\)/i);
  return match && match[1] ? match[1].trim() : "";
}

function containsLocationKeyword(segment: string): boolean {
  const lower = segment.toLowerCase();
  return (
    lower.includes("remote") ||
    lower.includes("onsite") ||
    lower.includes("on-site") ||
    lower.includes("in-person") ||
    lower.includes("hybrid") ||
    lower.includes("global") ||
    lower.includes("worldwide") ||
    lower.includes("usa") ||
    lower.includes("united states") ||
    lower.includes("uk") ||
    lower.includes("london") ||
    lower.includes("berlin") ||
    lower.includes("germany") ||
    lower.includes("canada") ||
    lower.includes("toronto") ||
    lower.includes("vancouver") ||
    lower.includes("sydney") ||
    lower.includes("australia") ||
    lower.includes("tokyo") ||
    lower.includes("japan") ||
    lower.includes("singapore") ||
    lower.includes("india") ||
    lower.includes("bangalore") ||
    lower.includes("brazil") ||
    lower.includes("mexico") ||
    lower.includes("netherlands") ||
    lower.includes("amsterdam") ||
    lower.includes("france") ||
    lower.includes("paris") ||
    lower.includes("spain") ||
    lower.includes("barcelona") ||
    lower.includes("ireland") ||
    lower.includes("dublin") ||
    lower.includes("poland") ||
    lower.includes("warsaw") ||
    lower.includes("sweden") ||
    lower.includes("stockholm") ||
    lower.includes("norway") ||
    lower.includes("oslo") ||
    lower.includes("denmark") ||
    lower.includes("copenhagen") ||
    lower.includes("finland") ||
    lower.includes("helsinki") ||
    lower.includes("portugal") ||
    lower.includes("lisbon") ||
    lower.includes("italy") ||
    lower.includes("milan") ||
    lower.includes("rome") ||
    lower.includes("austria") ||
    lower.includes("vienna") ||
    lower.includes("switzerland") ||
    lower.includes("zurich") ||
    lower.includes("belgium") ||
    lower.includes("brussels") ||
    lower.includes("ethiopia") ||
    lower.includes("nairobi") ||
    lower.includes("kenya") ||
    lower.includes("ghana") ||
    lower.includes("nigeria") ||
    lower.includes("south africa") ||
    lower.includes("cape town") ||
    lower.includes("dubai") ||
    lower.includes("uae") ||
    lower.includes("tel aviv") ||
    lower.includes("israel") ||
    lower.includes("turkey") ||
    lower.includes("istanbul") ||
    lower.includes("ukraine") ||
    lower.includes("kyiv") ||
    lower.includes("romania") ||
    lower.includes("bucharest") ||
    lower.includes("czech") ||
    lower.includes("prague") ||
    lower.includes("hungary") ||
    lower.includes("budapest") ||
    lower.includes("croatia") ||
    lower.includes("zagreb") ||
    lower.includes("serbia") ||
    lower.includes("belgrade") ||
    lower.includes("lithuania") ||
    lower.includes("vilnius") ||
    lower.includes("latvia") ||
    lower.includes("riga") ||
    lower.includes("estonia") ||
    lower.includes("tallinn") ||
    lower.includes("new zealand") ||
    lower.includes("auckland") ||
    lower.includes("wellington")
  );
}

export async function fetchHackerNews(): Promise<NormalizedJob[]> {
  const res = await fetch(SEARCH_URL, {
    headers: { "User-Agent": "job-copilot-collector/1.0" },
  });

  if (!res.ok) {
    throw new Error(`HackerNews search failed: ${res.status} ${res.statusText}`);
  }

  const searchData = (await res.json()) as { hits: HNHit[] };

  const hiringThread = searchData.hits.find((h) =>
    h.title.startsWith("Ask HN: Who is hiring?")
  );

  if (!hiringThread) {
    throw new Error("HackerNews: no 'Who is hiring?' thread found");
  }

  const itemRes = await fetch(
    `https://hn.algolia.com/api/v1/items/${hiringThread.objectID}`,
    { headers: { "User-Agent": "job-copilot-collector/1.0" } }
  );

  if (!itemRes.ok) {
    throw new Error(`HackerNews item fetch failed: ${itemRes.status} ${itemRes.statusText}`);
  }

  const thread = (await itemRes.json()) as HNItem;

  function countAllComments(item: HNItem): number {
    let n = 0;
    for (const child of item.children || []) {
      if (child.text && child.text.trim().length > 0) n += 1;
      n += countAllComments(child);
    }
    return n;
  }

  const directChildren = thread.children || [];
  const topLevelComments = directChildren.filter(
    (c) => c.parent_id === thread.id && c.text && c.text.trim().length > 0
  );
  const allComments = countAllComments(thread);
  console.log(
    `Hacker News thread ${thread.id}: ${topLevelComments.length} top-level comments (parent_id=${thread.id}); ${allComments} comments including nested replies; ${directChildren.length} direct children on the thread`
  );

  const now = new Date().toISOString();

  return topLevelComments.map((comment) => {
    const plainText = htmlToPlainText(comment.text!);
    const firstLine = plainText.split("\n")[0] || "";
    const { company, title, location, website } = parseHeader(firstLine);

    let applyUrl = extractFirstUrl(plainText);
    if (!applyUrl) {
      applyUrl = extractEmail(plainText);
    }

    return {
      id: `hackernews:${comment.id}`,
      source: "hackernews" as const,
      sourceUrl: `https://news.ycombinator.com/item?id=${comment.id}`,
      applyUrl: applyUrl || undefined,
      attribution: ATTRIBUTION,
      title,
      company,
      location,
      website: website || undefined,
      tags: [],
      jobType: undefined,
      description: plainText,
      postedAt: comment.created_at,
      firstSeen: now,
    };
  });
}