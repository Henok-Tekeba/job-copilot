/**
 * Regenerates the README benchmark section from eval result files, between
 * BENCHMARK:START / BENCHMARK:END markers. Never invents a number: if no
 * result file exists, the section says so.
 *
 *   npx tsx eval/emit-benchmark.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const README = path.join(ROOT, "README.md");
const RESULTS = path.join(ROOT, "eval", "results");

function latestFinal(): string | null {
  const files = fs
    .readdirSync(RESULTS)
    .filter((f) => f.startsWith("final-") && f.endsWith(".json"))
    .sort();
  return files.length ? path.join(RESULTS, files[files.length - 1]) : null;
}

function pct(m: { p: number | null; n: number }): string {
  return m.p === null ? "—" : `${(100 * m.p).toFixed(1)}% (n=${m.n})`;
}

function main() {
  let content = fs.existsSync(README) ? fs.readFileSync(README, "utf-8") : "# Job Copilot\n";
  const start = content.indexOf("<!-- BENCHMARK:START -->");
  const end = content.indexOf("<!-- BENCHMARK:END -->");

  const finalFile = latestFinal();
  const devFile = path.join(RESULTS, "latest.json");
  const src = finalFile ?? (fs.existsSync(devFile) ? devFile : null);

  let section: string;
  if (!src) {
    section = [
      "<!-- BENCHMARK:START -->",
      "## Benchmark",
      "",
      "No eval results yet. Run `npm run eval:dev`.",
      "",
      "<!-- BENCHMARK:END -->",
    ].join("\n");
  } else {
    const r = JSON.parse(fs.readFileSync(src, "utf-8"));
    const stamp = r.mode?.includes("unaudited") ? " **labels unaudited**" : "";
    const lines = [
      "<!-- BENCHMARK:START -->",
      "## Benchmark",
      "",
      `Engine v${r.engineVersion}, run ${r.runAt.slice(0, 10)}, label hashes ${r.labelHashes.natural}/${r.labelHashes.stratified}.${stamp}`,
      "",
      "| set | n | statement P / R | stance acc. | blocked P / R | verdict acc. |",
      "|---|---|---|---|---|---|",
    ];
    for (const key of ["dev", "test", "stratifiedDev", "stratifiedTest"]) {
      const s = r[key];
      if (!s) continue;
      lines.push(
        `| ${s.setName} | ${s.n} | ${pct(s.statementDetection.precision)} / ${pct(s.statementDetection.recall)} | ${pct(s.accuracy)} | ${pct(s.blocked.precision)} / ${pct(s.blocked.recall)} | ${pct(s.verdict?.accuracy)} |`
      );
    }
    lines.push(
      "",
      `Tricky negative cases: ${r.trickyCases.passed}/${r.trickyCases.total}. Baselines to beat: "always silent" and "always unclear" are in eval/README.md.`,
      "",
      "<!-- BENCHMARK:END -->"
    );
    section = lines.join("\n");
  }

  if (start >= 0 && end > start) {
    content = content.slice(0, start) + section + content.slice(end + "<!-- BENCHMARK:END -->".length);
  } else {
    content = content.trimEnd() + "\n\n" + section;
  }
  fs.writeFileSync(README, content);
  console.log("README benchmark section updated from", src ? path.relative(ROOT, src) : "(none)");
}

main();
