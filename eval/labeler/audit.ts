/**
 * Audit tool for the human review queue (Phase 1 quality pass). Dev-only.
 *
 *   npx tsx eval/labeler/audit.ts        (or: npm run audit)
 *
 * Reads eval/audit-queue.json and shows each posting with its current labels
 * and the reason it landed in the queue. Three actions per item:
 *
 *   a  accept — the labels are right
 *   w  wrong  — then relabel with 1-5 (stance) and q/w/e/r (verdict), Enter saves
 *   s  unsure — flag for a third look
 *
 * Results append to eval/audit-results.jsonl after every action. The queue and
 * the 40-posting random sample seed live in eval/audit-queue.json.
 */

import * as fs from "fs";
import * as http from "http";
import * as path from "path";

const ROOT = process.cwd();
const POSTINGS = path.join(ROOT, "eval", "postings.jsonl");
const LABELS = path.join(ROOT, "eval", "labels.jsonl");
const QUEUE = path.join(ROOT, "eval", "audit-queue.json");
const RESULTS = path.join(ROOT, "eval", "audit-results.jsonl");
const PORT = 4178;

type Posting = { id: string; company: string; title: string; hash: string; text: string };
type Label = { id: string; text_stance: string; overall_verdict: string; quote?: string; verdict_ai_prior?: string };
type QueueEntry = { id: string; reasons: string[] };

function readJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

const STANCES = ["sponsors", "no_sponsorship", "requires_authorization", "citizenship_or_clearance", "silent"];
const VERDICTS = ["open", "likely", "unclear", "unlikely"];

const KEYWORDS =
  /(visa|sponsor\w*|authoriz\w+|authoris\w+|citizen\w*|clearance|relocat\w+|work permit|right to work|nationality|resident\w*)/gi;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function page(): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Audit queue</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: oklch(0.145 0 0); color: oklch(0.97 0 0); font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
  header { position: sticky; top: 0; background: oklch(0.145 0 0); padding: 8px 0 12px; border-bottom: 1px solid oklch(1 0 0 / 8%); display: flex; gap: 16px; }
  .mono { font: 12px/1.4 ui-monospace, monospace; color: oklch(0.65 0.01 250); }
  main { max-width: 820px; margin: 24px auto 80px; }
  .text { white-space: pre-wrap; font: 13px/1.6 ui-monospace, monospace; border: 1px solid oklch(1 0 0 / 8%); border-radius: 8px; padding: 16px; max-height: 50vh; overflow: auto; background: oklch(0.18 0 0); }
  mark { background: oklch(0.82 0.16 80 / 25%); color: inherit; border-radius: 2px; }
  .labels { margin: 12px 0; display: flex; gap: 16px; font: 13px ui-monospace, monospace; }
  .labels span { border: 1px solid oklch(1 0 0 / 14%); border-radius: 6px; padding: 4px 8px; }
  .quote { border-left: 3px solid oklch(0.78 0.12 230); padding: 4px 10px; margin: 8px 0; font: 12px/1.5 ui-monospace, monospace; color: oklch(0.65 0.01 250); }
  button { padding: 8px 14px; margin-right: 8px; border-radius: 6px; border: 1px solid oklch(1 0 0 / 8%); background: oklch(0.18 0 0); color: oklch(0.97 0 0); cursor: pointer; font: 13px ui-sans-serif, system-ui, sans-serif; }
  button:hover { background: oklch(0.22 0 0); }
  button.on { border-color: oklch(0.78 0.12 230); background: oklch(0.78 0.12 230 / 12%); }
  .hidden { display: none; }
</style></head>
<body>
<header><span class="mono" id="progress"></span><span class="mono">a accept · w wrong · s unsure · 1-5 stance · q/w/e/r verdict</span></header>
<main>
  <div class="mono" id="meta"></div>
  <div class="labels" id="labels"></div>
  <div id="priorBox" class="quote hidden"></div>
  <div id="quoteBox" class="quote hidden"></div>
  <div class="text" id="text"></div>
  <div style="margin-top:16px">
    <button id="bA" onclick="act('accepted')">a · accept</button>
    <button id="bW" onclick="startCorrection()">w · wrong (relabel below)</button>
    <button id="bS" onclick="act('unsure')">s · unsure</button>
  </div>
  <div id="corrector" class="hidden" style="margin-top:16px; border:1px solid oklch(1 0 0 / 8%); border-radius:8px; padding:16px">
    <div class="mono">Corrected stance (1-5): <span id="cs">—</span> · corrected verdict (q/w/e/r): <span id="cv">—</span> · Enter saves</div>
  </div>
</main>
<script>
const STANCES = ${JSON.stringify(STANCES)};
const VERDICTS = ${JSON.stringify(VERDICTS)};
let queue = [], postings = new Map(), labels = new Map(), index = 0;
let mode = null, cs = null, cv = null;

function highlight(text) {
  return escapeHtml(text).replace(${JSON.stringify(KEYWORDS.source)}, '<mark>$1</mark>');
}
async function save(result) {
  const item = queue[index];
  const body = { id: item.id, action: result, reasons: item.reasons, at: new Date().toISOString() };
  if (result === 'corrected') { body.correctedStance = cs; body.correctedVerdict = cv; }
  const res = await fetch('/api/audit', { method: 'POST', body: JSON.stringify(body) });
  queue[index].done = true;
  const data = await res.json();
  labels = new Map(data.labels.map(l => [l.id, l]));
  index++;
  mode = null; cs = null; cv = null;
  render();
}
window.act = (action) => save(action);
window.startCorrection = () => { mode = 'correct'; document.getElementById('corrector').classList.remove('hidden'); paint(); };

function render() {
  const item = queue[index];
  document.getElementById('progress').innerHTML = '<b>' + index + '</b> / ' + queue.length + ' audited';
  if (!item) { document.getElementById('text').textContent = 'Audit complete. Thank you.'; return; }
  const p = postings.get(item.id), l = labels.get(item.id) || {};
  document.getElementById('meta').textContent = item.reasons.join(' · ') + ' — ' + (p.company || '?') + ' — ' + p.title;
  document.getElementById('text').innerHTML = highlight(p.text);
  document.getElementById('text').scrollTop = 0;
  document.getElementById('labels').innerHTML =
    '<span>' + (l.text_stance || '?') + '</span><span>' + (l.overall_verdict || '?') + '</span>' +
    (l.verdict_ai_prior ? '<span>ai prior: ' + l.verdict_ai_prior + '</span>' : '');
  const q = document.getElementById('quoteBox');
  if (l.quote) { q.classList.remove('hidden'); q.textContent = 'label quote: ' + l.quote; } else q.classList.add('hidden');
  cs = null; cv = null;
  document.getElementById('cs').textContent = '—'; document.getElementById('cv').textContent = '—';
  document.getElementById('corrector').classList.add('hidden');
  paint();
}
function paint() {
  document.getElementById('bA').classList.toggle('on', false);
  document.getElementById('bW').classList.toggle('on', mode === 'correct');
  document.getElementById('bS').classList.toggle('on', false);
}
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (mode === 'correct') {
    const si = ['1','2','3','4','5'].indexOf(k);
    if (si >= 0) { cs = STANCES[si]; document.getElementById('cs').textContent = cs; return; }
    const vi = ['q','w','e','r'].indexOf(k);
    if (vi >= 0) { cv = VERDICTS[vi]; document.getElementById('cv').textContent = cv; return; }
    if (k === 'enter' && cs && cv) { document.getElementById('corrector').classList.add('hidden'); save('corrected'); }
    return;
  }
  if (k === 'a') save('accepted');
  if (k === 'w') startCorrection();
  if (k === 's') save('unsure');
});

async function init() {
  const res = await fetch('/api/state');
  const data = await res.json();
  queue = data.queue.filter(i => !data.doneIds.includes(i.id));
  postings = new Map(data.postings.map(p => [p.id, p]));
  labels = new Map(data.labels.map(l => [l.id, l]));
  render();
}
init();
</script></body></html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(page());
    return;
  }
  if (url === "/api/state") {
    const queue: QueueEntry[] = JSON.parse(fs.readFileSync(QUEUE, "utf-8")).queue;
    const done = readJsonl<{ id: string }>(RESULTS);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        queue,
        doneIds: done.map((d) => d.id),
        postings: readJsonl<Posting>(POSTINGS),
        labels: readJsonl<Label>(LABELS),
      })
    );
    return;
  }
  if (url === "/api/audit" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      fs.appendFileSync(RESULTS, body.replace(/\n/g, " ") + "\n");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ labels: readJsonl<Label>(LABELS) }));
    });
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`Audit tool: http://localhost:${PORT}`);
});
