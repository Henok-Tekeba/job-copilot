/**
 * Audit tool for the human review queue (Phase 1 quality pass). Dev-only.
 *
 *   npx tsx eval/labeler/audit.ts        (or: npm run audit)
 *
 * The queue (eval/audit-queue.json) is split into three groups, shuffled at
 * build time, and you work them in order — keys 1 / 2 / 3 switch groups:
 *
 *   A  the 40 random silent postings
 *   B  all non-silent natural postings, plus all stratified postings
 *   C  the 38 flagged-verdict postings, all pass A/B disagreements,
 *      and the revisit-flagged ones
 *
 * Four actions per item, all auto-saved to eval/audit-results.jsonl:
 *
 *   a  accept — labels stand
 *   r  reject — the quote is not real evidence: verdict becomes "unclear",
 *              the old value moves to verdict_ai_prior, source="human_reviewed"
 *   w  wrong  — relabel inline: 1-5 stance, q/w/e/r verdict, Enter saves
 *   s  unsure — flag for a third look
 *
 * z undoes the last action, restoring any label it changed. Rejections and
 * corrections write back into the labels file the item came from (natural or
 * stratified), so the eval sets stay the single source of truth.
 */

import * as fs from "fs";
import * as http from "http";
import * as path from "path";

const ROOT = process.cwd();
const POSTINGS = path.join(ROOT, "eval", "postings.jsonl");
const STRAT_POSTINGS = path.join(ROOT, "eval", "stratified", "postings.jsonl");
const LABELS = path.join(ROOT, "eval", "labels.jsonl");
const STRAT_LABELS = path.join(ROOT, "eval", "stratified", "labels.jsonl");
const QUEUE = path.join(ROOT, "eval", "audit-queue.json");
const RESULTS = path.join(ROOT, "eval", "audit-results.jsonl");
const PORT = 4178;

type Posting = { id: string; company: string; title: string; hash: string; text: string };
type Label = {
  id: string;
  text_stance: string;
  overall_verdict: string;
  quote?: string;
  verdict_ai_prior?: string;
  source?: string;
  classes?: string[];
  labeledBy?: string;
};
type QueueEntry = { id: string; reasons: string[]; group: "A" | "B" | "C" };

function readJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

function writeLabels(file: string, labels: Label[]): void {
  fs.writeFileSync(file, labels.map((l) => JSON.stringify(l)).join("\n") + "\n");
}

/** Which labels file an id lives in: the two sets are disjoint by construction. */
function fileForId(id: string): string {
  const natural = new Set(readJsonl<Label>(LABELS).map((l) => l.id));
  return natural.has(id) ? LABELS : STRAT_LABELS;
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
  header { position: sticky; top: 0; z-index: 1; background: oklch(0.145 0 0); padding: 8px 0 12px; border-bottom: 1px solid oklch(1 0 0 / 8%); }
  .bar { display: flex; gap: 8px; align-items: center; }
  .mono { font: 12px/1.4 ui-monospace, monospace; color: oklch(0.65 0.01 250); }
  .tab { border: 1px solid oklch(1 0 0 / 8%); background: oklch(0.18 0 0); color: oklch(0.97 0 0); border-radius: 6px; padding: 6px 12px; cursor: pointer; font: 12px ui-monospace, monospace; }
  .tab.on { border-color: oklch(0.78 0.12 230); background: oklch(0.78 0.12 230 / 12%); }
  main { max-width: 820px; margin: 24px auto 80px; }
  .text { white-space: pre-wrap; font: 13px/1.6 ui-monospace, monospace; border: 1px solid oklch(1 0 0 / 8%); border-radius: 8px; padding: 16px; max-height: 48vh; overflow: auto; background: oklch(0.18 0 0); }
  mark { background: oklch(0.82 0.16 80 / 25%); color: inherit; border-radius: 2px; }
  .labels { margin: 12px 0; display: flex; gap: 8px; flex-wrap: wrap; font: 13px ui-monospace, monospace; }
  .labels span { border: 1px solid oklch(1 0 0 / 14%); border-radius: 6px; padding: 4px 8px; }
  .quote { border-left: 3px solid oklch(0.78 0.12 230); padding: 4px 10px; margin: 8px 0; font: 12px/1.5 ui-monospace, monospace; color: oklch(0.65 0.01 250); }
  button { padding: 8px 14px; margin-right: 8px; border-radius: 6px; border: 1px solid oklch(1 0 0 / 8%); background: oklch(0.18 0 0); color: oklch(0.97 0 0); cursor: pointer; font: 13px ui-sans-serif, system-ui, sans-serif; }
  button:hover { background: oklch(0.22 0 0); }
  button.on { border-color: oklch(0.78 0.12 230); background: oklch(0.78 0.12 230 / 12%); }
  .hidden { display: none; }
</style></head>
<body>
<header>
  <div class="bar">
    <button class="tab" id="tA" onclick="setGroup('A')">1 · A random silent (<span id="cA">…</span>)</button>
    <button class="tab" id="tB" onclick="setGroup('B')">2 · B non-silent + stratified (<span id="cB">…</span>)</button>
    <button class="tab" id="tC" onclick="setGroup('C')">3 · C flagged verdicts + disagreements + revisit (<span id="cC">…</span>)</button>
    <span class="mono" style="margin-left:auto">z undo</span>
  </div>
</header>
<main>
  <div class="mono" id="meta"></div>
  <div class="labels" id="labels"></div>
  <div id="priorBox" class="quote hidden"></div>
  <div id="quoteBox" class="quote hidden"></div>
  <div class="text" id="text"></div>
  <div style="margin-top:16px">
    <button id="bAcc" onclick="act('accepted')">a · accept</button>
    <button id="bRej" onclick="act('rejected')">r · reject quote → unclear + prior</button>
    <button id="bWr" onclick="startCorrection()">w · wrong + my label</button>
    <button id="bUns" onclick="act('unsure')">s · unsure</button>
  </div>
  <div id="corrector" class="hidden" style="margin-top:16px; border:1px solid oklch(1 0 0 / 8%); border-radius:8px; padding:16px">
    <div class="mono">Corrected stance (1-5): <span id="cs">—</span> · corrected verdict (q/w/e/r): <span id="cv">—</span> · Enter saves</div>
  </div>
</main>
<script>
const STANCES = ${JSON.stringify(STANCES)};
const VERDICTS = ${JSON.stringify(VERDICTS)};
let queue = [], postings = new Map(), labels = new Map(), labelsOf = new Map();
let group = 'A', index = 0, mode = null, cs = null, cv = null;

function groupItems(g) { return queue.filter(i => i.group === g); }
function doneIds() { return new Set(queue.filter(i => i.done).map(i => i.id)); }

function highlight(text) {
  return escapeHtml(text).replace(${JSON.stringify(KEYWORDS.source)}, '<mark>$1</mark>');
}

async function save(action, extra) {
  const item = groupItems(group)[index];
  const body = { id: item.id, action, group, reasons: item.reasons, set: item.set || 'natural', at: new Date().toISOString(), ...(extra || {}) };
  const res = await fetch('/api/audit', { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  labels = new Map(data.labels.map(l => [l.id, l]));
  labelsOf = new Map([...data.labelsNatural.map(l => [l.id, l]), ...data.labelsStrat.map(l => [l.id, l])]);
  item.done = true;
  render();
}

window.act = (action) => save(action, null);
window.startCorrection = () => { mode = 'correct'; cs = null; cv = null; document.getElementById('corrector').classList.remove('hidden'); document.getElementById('cs').textContent = '—'; document.getElementById('cv').textContent = '—'; };
window.setGroup = (g) => { group = g; index = 0; mode = null; document.getElementById('corrector').classList.add('hidden'); render(); };

async function undo() {
  const res = await fetch('/api/undo', { method: 'POST' });
  const data = await res.json();
  if (!data.removed) return;
  labels = new Map(data.labels.map(l => [l.id, l]));
  labelsOf = new Map([...data.labelsNatural.map(l => [l.id, l]), ...data.labelsStrat.map(l => [l.id, l])]);
  queue.forEach(i => { if (i.id === data.removed.id) i.done = false; });
  const g = data.removed.group || group;
  group = g;
  const items = groupItems(g);
  index = Math.max(0, items.findIndex(i => i.id === data.removed.id));
  render();
}

function render() {
  for (const g of ['A','B','C']) {
    const items = groupItems(g), done = items.filter(i => i.done).length;
    document.getElementById('c'+g).textContent = done + '/' + items.length;
    document.getElementById('t'+g).classList.toggle('on', g === group);
  }
  const items = groupItems(group);
  const item = items[index];
  document.getElementById('progress') && (document.getElementById('progress').textContent = '');
  if (!item) { document.getElementById('text').textContent = 'Group ' + group + ' complete. Press 1/2/3 for another group.'; return; }
  const p = postings.get(item.id), l = labels.get(item.id) || {};
  document.getElementById('meta').textContent = '[' + (item.set || 'natural') + '] ' + item.reasons.join(' · ') + ' — ' + (p.company || '?') + ' — ' + p.title;
  document.getElementById('text').innerHTML = highlight(p.text);
  document.getElementById('text').scrollTop = 0;
  document.getElementById('labels').innerHTML =
    '<span>' + (l.text_stance || '?') + '</span><span>' + (l.overall_verdict || '?') + '</span>' +
    (l.classes ? '<span>' + l.classes.join('+') + '</span>' : '') +
    (l.verdict_ai_prior ? '<span>ai prior: ' + l.verdict_ai_prior + '</span>' : '') +
    (l.source ? '<span>' + l.source + '</span>' : '');
  const q = document.getElementById('quoteBox');
  if (l.quote) { q.classList.remove('hidden'); q.textContent = 'label quote: ' + l.quote; } else q.classList.add('hidden');
  const pb = document.getElementById('priorBox');
  pb.classList.add('hidden');
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (['1','2','3'].includes(k)) { setGroup(['A','B','C'][Number(k)-1]); return; }
  if (k === 'z') { undo(); return; }
  if (mode === 'correct') {
    const si = ['1','2','3','4','5'].indexOf(k);
    if (si >= 0) { cs = STANCES[si]; document.getElementById('cs').textContent = cs; return; }
    const vi = ['q','w','e','r'].indexOf(k);
    if (vi >= 0) { cv = VERDICTS[vi]; document.getElementById('cv').textContent = cv; return; }
    if (k === 'enter' && cs && cv) { document.getElementById('corrector').classList.add('hidden'); save('corrected', { correctedStance: cs, correctedVerdict: cv }); }
    return;
  }
  if (k === 'a') save('accepted', null);
  if (k === 'r') save('rejected', null);
  if (k === 'w') startCorrection();
  if (k === 's') save('unsure', null);
});

async function init() {
  const res = await fetch('/api/state');
  const data = await res.json();
  queue = data.queue;
  const done = new Set(data.doneIds);
  queue.forEach(i => { if (done.has(i.id)) i.done = true; });
  postings = new Map(data.postings.map(p => [p.id, p]));
  labels = new Map(data.labels.map(l => [l.id, l]));
  labelsOf = new Map(data.labels.map(l => [l.id, l]));
  render();
}
init();
</script></body></html>`;
}

function allLabels(): Label[] {
  return [...readJsonl<Label>(LABELS), ...readJsonl<Label>(STRAT_LABELS)];
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
        postings: [...readJsonl<Posting>(POSTINGS), ...readJsonl<Posting>(STRAT_POSTINGS)],
        labels: allLabels(),
      })
    );
    return;
  }
  if (url === "/api/audit" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const entry = JSON.parse(body) as {
        id: string;
        action: string;
        group: string;
        correctedStance?: string;
        correctedVerdict?: string;
      };
      const file = fileForId(entry.id);
      const labels = readJsonl<Label>(file);
      const label = labels.find((l) => l.id === entry.id);
      const result: Record<string, unknown> = { ...entry };

      if (label && (entry.action === "rejected" || entry.action === "corrected")) {
        // Keep the pre-action label in the result so undo can restore exactly.
        result.before = {
          text_stance: label.text_stance,
          overall_verdict: label.overall_verdict,
          verdict_ai_prior: label.verdict_ai_prior ?? "",
        };
      }

      if (label && entry.action === "rejected") {
        // The quote is not real evidence: verdict drops to unclear and the old
        // value is kept as the AI prior, so Phase 4 can re-derive it from
        // cited records instead of model memory.
        label.verdict_ai_prior = label.overall_verdict;
        label.overall_verdict = "unclear";
        label.source = "human_reviewed";
        writeLabels(file, labels);
      } else if (label && entry.action === "corrected" && entry.correctedStance && entry.correctedVerdict) {
        label.text_stance = entry.correctedStance;
        label.overall_verdict = entry.correctedVerdict;
        label.source = "human_reviewed";
        writeLabels(file, labels);
      }

      fs.appendFileSync(RESULTS, JSON.stringify(entry) + "\n");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ labels: allLabels(), labelsNatural: readJsonl<Label>(LABELS), labelsStrat: readJsonl<Label>(STRAT_LABELS) }));
    });
    return;
  }
  if (url === "/api/undo" && req.method === "POST") {
    const results = readJsonl<Record<string, string>>(RESULTS);
    const removed = results.pop();
    fs.writeFileSync(RESULTS, results.map((r) => JSON.stringify(r)).join("\n") + (results.length ? "\n" : ""));
    if (removed && (removed.action === "rejected" || removed.action === "corrected")) {
      // Restore the label from the action's before-image, exactly.
      const before = removed.before
        ? typeof removed.before === "string"
          ? JSON.parse(removed.before)
          : removed.before
        : null;
      if (before) {
        const file = fileForId(removed.id);
        const labels = readJsonl<Label>(file);
        const label = labels.find((l) => l.id === removed.id);
        if (label) {
          label.text_stance = before.text_stance;
          label.overall_verdict = before.overall_verdict;
          if (before.verdict_ai_prior) label.verdict_ai_prior = before.verdict_ai_prior;
          else delete label.verdict_ai_prior;
          delete label.source;
          writeLabels(file, labels);
        }
      }
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ removed, labels: allLabels(), labelsNatural: readJsonl<Label>(LABELS), labelsStrat: readJsonl<Label>(STRAT_LABELS) }));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`Audit tool: http://localhost:${PORT}`);
  console.log("Groups: 1 = A (random silent), 2 = B (non-silent + stratified), 3 = C (flagged verdicts, disagreements, revisit)");
});
