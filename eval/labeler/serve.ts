/**
 * Local labeling tool (Phase 1). Dev-only: never imported by the app, never
 * shipped in the static export.
 *
 *   npx tsx eval/labeler/serve.ts        (or: npm run label)
 *
 * Serves one page on http://localhost:4177. Labels are appended to
 * eval/labels.jsonl after every single label, so a crash loses nothing.
 *
 * Blind labeling on purpose: the page shows the posting text and nothing
 * else — no engine output, no existing eligibility score. The human is the
 * ground truth; the engine must not leak into the labels.
 *
 * Keys:
 *   1..5   text_stance: sponsors / no_sponsorship / requires_authorization /
 *          citizenship_or_clearance / silent
 *   q w e r  overall_verdict: open / likely / unclear / unlikely
 *   (choosing both saves automatically and advances)
 *   space  skip for now
 *   u      toggle the revisit flag
 *   z      undo the last saved label
 */

import * as fs from "fs";
import * as http from "http";
import * as path from "path";

const ROOT = process.cwd();
const POSTINGS = path.join(ROOT, "eval", "postings.jsonl");
const LABELS = path.join(ROOT, "eval", "labels.jsonl");
const PORT = 4177;

type Posting = {
  id: string;
  company: string;
  title: string;
  url: string;
  hash: string;
  text: string;
};

type Label = {
  id: string;
  hash: string;
  text_stance: string;
  overall_verdict: string;
  revisit: boolean;
  labeledAt: string;
};

function readPostings(): Posting[] {
  return fs
    .readFileSync(POSTINGS, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readLabels(): Label[] {
  if (!fs.existsSync(LABELS)) return [];
  return fs
    .readFileSync(LABELS, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const STANCES = [
  "sponsors",
  "no_sponsorship",
  "requires_authorization",
  "citizenship_or_clearance",
  "silent",
] as const;

const VERDICTS = ["open", "likely", "unclear", "unlikely"] as const;

/** Terms that make sponsorship language visible at a glance. */
const KEYWORDS =
  /(visa|sponsor\w*|authoriz\w+|citizen\w*|clearance|relocat\w+|work permit|right to work|nationality|resident\w*)/gi;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function page(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Job Copilot — labeling</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px; background: oklch(0.145 0 0); color: oklch(0.97 0 0);
    font: 14px/1.5 ui-sans-serif, system-ui, sans-serif;
  }
  header {
    position: sticky; top: 0; z-index: 1; display: flex; align-items: center;
    gap: 16px; padding: 8px 0 12px; background: oklch(0.145 0 0);
    border-bottom: 1px solid oklch(1 0 0 / 8%);
  }
  .progress { font: 13px/1 ui-monospace, monospace; color: oklch(0.65 0.01 250); }
  .progress b { color: oklch(0.97 0 0); }
  main { max-width: 820px; margin: 24px auto 80px; }
  .meta { font: 12px/1.4 ui-monospace, monospace; color: oklch(0.65 0.01 250); margin-bottom: 16px; }
  .text {
    white-space: pre-wrap; font: 13px/1.6 ui-monospace, monospace;
    border: 1px solid oklch(1 0 0 / 8%); border-radius: 8px;
    padding: 16px; max-height: 55vh; overflow: auto; background: oklch(0.18 0 0);
  }
  mark { background: oklch(0.82 0.16 80 / 25%); color: inherit; border-radius: 2px; }
  .choices { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
  .group h3 { margin: 0 0 8px; font: 11px/1 ui-monospace, monospace;
    text-transform: uppercase; letter-spacing: 0.06em; color: oklch(0.65 0.01 250); }
  button {
    display: block; width: 100%; text-align: left; margin-bottom: 4px;
    padding: 7px 10px; border-radius: 6px; border: 1px solid oklch(1 0 0 / 8%);
    background: oklch(0.18 0 0); color: oklch(0.97 0 0); cursor: pointer;
    font: 13px/1.3 ui-sans-serif, system-ui, sans-serif;
  }
  button kbd {
    float: right; font: 11px/1 ui-monospace, monospace; color: oklch(0.65 0.01 250);
    border: 1px solid oklch(1 0 0 / 14%); border-radius: 4px; padding: 2px 5px;
  }
  button.on { border-color: oklch(0.78 0.12 230); background: oklch(0.78 0.12 230 / 12%); }
  button:hover { background: oklch(0.22 0 0); }
  .flags { margin-top: 16px; display: flex; gap: 12px; align-items: center;
    font: 12px/1 ui-monospace, monospace; color: oklch(0.65 0.01 250); }
  .flags button { width: auto; display: inline-block; margin: 0; }
  .flags .on { color: oklch(0.82 0.16 80); border-color: oklch(0.82 0.16 80); }
  .saved { color: oklch(0.78 0.17 155); }
</style>
</head>
<body>
<header>
  <span class="progress" id="progress">loading…</span>
  <span class="progress" id="stanceState"></span>
  <span class="progress" id="verdictState"></span>
  <span class="progress" style="margin-left:auto">z undo · space skip · u revisit</span>
</header>
<main>
  <div class="meta" id="meta"></div>
  <div class="text" id="text"></div>
  <div class="choices">
    <div class="group">
      <h3>a) What does the posting itself say?</h3>
      <div id="stances"></div>
    </div>
    <div class="group">
      <h3>b) Your overall verdict</h3>
      <div id="verdicts"></div>
    </div>
  </div>
  <div class="flags">
    <button id="revisit" onclick="toggleRevisit()">u · revisit later</button>
    <span id="saveNote"></span>
  </div>
</main>
<script>
const STANCES = ${JSON.stringify(STANCES)};
const VERDICTS = ${JSON.stringify(VERDICTS)};
let postings = [], labeled = new Map(), index = 0;
let stance = null, verdict = null, revisit = false;

function highlight(text) {
  const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return escaped.replace(${JSON.stringify(KEYWORDS.source)}, '<mark>$1</mark>');
}

function render() {
  const p = postings[index];
  if (!p) { document.getElementById('text').textContent = 'All postings labeled. Thank you.'; return; }
  document.getElementById('meta').textContent = (index+1) + ' / ' + postings.length + ' — ' + (p.company || 'unknown company') + ' — ' + p.title;
  document.getElementById('text').innerHTML = highlight(p.text);
  document.getElementById('text').scrollTop = 0;
  const existing = labeled.get(p.id);
  stance = existing ? existing.text_stance : null;
  verdict = existing ? existing.overall_verdict : null;
  revisit = existing ? existing.revisit : false;
  paint();
  document.getElementById('progress').innerHTML = '<b>' + labeled.size + '</b> of ' + postings.length + ' labeled · ' + (postings.length - labeled.size) + ' left';
}

function paint() {
  for (const el of document.querySelectorAll('#stances button')) el.classList.toggle('on', el.dataset.v === stance);
  for (const el of document.querySelectorAll('#verdicts button')) el.classList.toggle('on', el.dataset.v === verdict);
  document.getElementById('stanceState').textContent = stance ? ('stance: ' + stance) : '';
  document.getElementById('verdictState').textContent = verdict ? ('verdict: ' + verdict) : '';
  const rv = document.getElementById('revisit');
  rv.classList.toggle('on', revisit);
}

async function save() {
  const p = postings[index];
  const body = JSON.stringify({ id: p.id, hash: p.hash, text_stance: stance, overall_verdict: verdict, revisit, labeledAt: new Date().toISOString() });
  const res = await fetch('/api/label', { method: 'POST', body });
  const labels = await res.json();
  labeled = new Map(labels.map(l => [l.id, l]));
  document.getElementById('saveNote').textContent = 'saved ✓';
  setTimeout(() => document.getElementById('saveNote').textContent = '', 1200);
  index++;
  render();
}

async function undo() {
  const res = await fetch('/api/undo', { method: 'POST' });
  const data = await res.json();
  if (!data.removed) return;
  labeled = new Map(data.labels.map(l => [l.id, l]));
  index = Math.max(0, index - 1);
  render();
}

function toggleRevisit() { revisit = !revisit; paint(); }

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;
  const k = e.key;
  const si = ['1','2','3','4','5'].indexOf(k);
  if (si >= 0) { stance = STANCES[si]; paint(); if (verdict) save(); return; }
  const vi = ['q','w','e','r'].indexOf(k.toLowerCase());
  if (vi >= 0) { verdict = VERDICTS[vi]; paint(); if (stance) save(); return; }
  if (k === ' ') { e.preventDefault(); index = Math.min(postings.length - 1, index + 1); render(); }
  if (k === 'u') toggleRevisit();
  if (k === 'z') undo();
});

async function init() {
  const res = await fetch('/api/postings');
  const data = await res.json();
  postings = data.postings;
  labeled = new Map(data.labels.map(l => [l.id, l]));
  index = labeled.size; // resume where you left off
  render();
}
init();
</script>
</body>
</html>`;
}

function server(): void {
  const server = http.createServer((req, res) => {
    const url = req.url ?? "/";

    if (url === "/" || url.startsWith("/index")) {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(page());
      return;
    }

    if (url === "/api/postings") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({ postings: readPostings(), labels: readLabels() })
      );
      return;
    }

    if (url === "/api/label" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const label = JSON.parse(body) as Label;
        const labels = readLabels().filter((l) => l.id !== label.id);
        labels.push(label);
        fs.writeFileSync(
          LABELS,
          labels.map((l) => JSON.stringify(l)).join("\n") + "\n"
        );
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(labels));
      });
      return;
    }

    if (url === "/api/undo" && req.method === "POST") {
      const labels = readLabels();
      const removed = labels.pop();
      fs.writeFileSync(
        LABELS,
        labels.map((l) => JSON.stringify(l)).join("\n") + (labels.length ? "\n" : "")
      );
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ removed, labels }));
      return;
    }

    res.writeHead(404);
    res.end("not found");
  });

  server.listen(PORT, () => {
    console.log(`Labeling tool: http://localhost:${PORT}`);
  });
}

server();
