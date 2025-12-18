import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const specPath = path.join(repoRoot, "openapi.json");
const srcRoot = path.join(repoRoot, "src");
const apiRoot = path.join(srcRoot, "api");

function readJson(p) {
  const raw = fs.readFileSync(p, "utf8");
  // Some tools write UTF-8 with BOM which breaks JSON.parse in Node.
  const sanitized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(sanitized);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Convert OpenAPI path `/api/user/{id}` to a regex that can match:
// - "/api/user/123"
// - `/api/user/${id}`
// - `/api/user/${userId}`
function openApiPathToUsageRegex(openApiPath) {
  const parts = openApiPath.split(/(\{[^}]+\})/g).filter(Boolean);
  const reParts = parts.map((p) => {
    if (p.startsWith("{") && p.endsWith("}")) {
      // Heuristic: match either `${...}` (template literal) OR a uuid-like OR a number.
      // This avoids false positives where `{id}` would match literal segments like `/Users` or `/user`.
      const uuid =
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
      const num = "\\d+";
      const tpl = "\\$\\{[^}]+\\}";
      return `(?:${tpl}|${uuid}|${num})`;
    }
    return escapeRegex(p);
  });
  // Allow query strings directly after the path (`/path?x=1`) and end-of-string/quote.
  // Disallow matching when the next char continues the path with another segment ("/").
  return new RegExp(`${reParts.join("")}(?=[\"'\`\\?]|$)`, "g");
}

function lineNumberAt(text, index) {
  // 1-based line numbers
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function methodsForPath(spec, p) {
  const obj = spec.paths?.[p] ?? {};
  return Object.keys(obj)
    .filter((k) => ["get", "post", "put", "patch", "delete"].includes(k))
    .map((k) => k.toUpperCase())
    .sort();
}

function extractApiWrappers(apiDir) {
  // Very lightweight parser:
  // - finds "export const X = {" blocks
  // - inside them finds "method: async" definitions
  // - finds apiClient.<verb>(<endpoint>)
  const files = walk(apiDir).filter((f) => f.endsWith(".ts"));
  const wrappers = []; // { api: string, method: string, endpoints: string[], file: string }

  const apiDeclRe = /export\s+const\s+(\w+)\s*=\s*\{/g;
  const methodRe = /^\s*(\w+)\s*:\s*async\b/m;
  const endpointRe =
    /apiClient\.(get|post|put|delete|postFormData|putFormData)\s*(?:<[^>]*>)?\s*\(\s*([`'"])([\s\S]*?)\2/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let m;
    while ((m = apiDeclRe.exec(content))) {
      const apiName = m[1];

      // Grab block text heuristically: from "export const X = {" to the next "};"
      const start = m.index;
      const end = content.indexOf("};", start);
      const block = end !== -1 ? content.slice(start, end + 2) : content.slice(start);

      // Find all "foo: async" method names in this block and associate with any apiClient calls in the whole block.
      // (Good enough for our repo style.)
      const methodNames = [];
      const lines = block.split("\n");
      for (const line of lines) {
        const mm = methodRe.exec(line);
        if (mm) methodNames.push(mm[1]);
      }

      // Extract endpoints per method by splitting the block on "methodName:" markers.
      for (const methodName of methodNames) {
        const marker = new RegExp(`\\b${escapeRegex(methodName)}\\s*:\\s*async\\b`);
        const idx = block.search(marker);
        if (idx === -1) continue;
        // method section: from marker to next "},"
        const rest = block.slice(idx);
        const nextIdx = rest.slice(1).search(/\n\s*\w+\s*:\s*async\b/);
        const section = nextIdx === -1 ? rest : rest.slice(0, nextIdx + 1);

        const endpoints = [];
        endpointRe.lastIndex = 0;
        let em;
        while ((em = endpointRe.exec(section))) {
          endpoints.push(em[3]);
        }

        if (endpoints.length > 0) {
          wrappers.push({
            api: apiName,
            method: methodName,
            endpoints: Array.from(new Set(endpoints)),
            file: path.relative(repoRoot, file).replaceAll("\\", "/"),
          });
        }
      }
    }
  }

  return wrappers;
}

function findUiCallsites(srcDir, wrappers) {
  const files = walk(srcDir).filter((f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && !f.includes(`${path.sep}api${path.sep}`));
  const index = new Map(); // key "api.method" -> hits[]

  for (const w of wrappers) {
    index.set(`${w.api}.${w.method}`, []);
  }

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const w of wrappers) {
      const key = `${w.api}.${w.method}`;
      const re = new RegExp(`\\b${escapeRegex(w.api)}\\s*\\.\\s*${escapeRegex(w.method)}\\s*\\(`, "g");
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content))) {
        index.get(key).push({
          file: path.relative(repoRoot, file).replaceAll("\\", "/"),
          line: lineNumberAt(content, m.index),
          match: `${w.api}.${w.method}(`,
        });
      }
    }
  }

  return index;
}

const spec = readJson(specPath);
const openApiPaths = Object.keys(spec.paths || {}).sort();
const files = walk(srcRoot).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));

const wrappers = extractApiWrappers(apiRoot);
const uiCallsitesByWrapper = findUiCallsites(srcRoot, wrappers);

const results = [];

for (const p of openApiPaths) {
  const re = openApiPathToUsageRegex(p);
  const hitsAll = [];
  const wrappersForPath = [];
  const uiHits = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content))) {
      const hit = {
        file: path.relative(repoRoot, file).replaceAll("\\", "/"),
        line: lineNumberAt(content, m.index),
        match: m[0],
      };
      hitsAll.push(hit);
      // Avoid huge reports if something goes wrong with regex.
      if (hitsAll.length > 2000) break;
    }
    if (hitsAll.length > 2000) break;
  }

  // Determine which wrapper methods map to this OpenAPI path.
  for (const w of wrappers) {
    const matches = w.endpoints.some((ep) => re.test(ep));
    re.lastIndex = 0;
    if (!matches) continue;
    wrappersForPath.push(`${w.api}.${w.method}`);
  }

  // Find UI callsites for those wrappers
  for (const wm of wrappersForPath) {
    const hits = uiCallsitesByWrapper.get(wm) ?? [];
    uiHits.push(...hits.map((h) => ({ ...h, match: wm })));
  }

  results.push({
    path: p,
    methods: methodsForPath(spec, p),
    referencedInCode: hitsAll.length > 0,
    usedInUi: uiHits.length > 0,
    hitsAll,
    wrappers: Array.from(new Set(wrappersForPath)).sort(),
    uiHits: uiHits.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file))),
  });
}

const referencedCount = results.filter((r) => r.referencedInCode).length;
const usedInUiCount = results.filter((r) => r.usedInUi).length;
const totalCount = results.length;

const lines = [];
lines.push(`# API coverage report`);
lines.push(``);
lines.push(`Source: \`openapi.json\``);
lines.push(`Scanned: \`src/**/*.ts(x)\``);
lines.push(``);
lines.push(`**Referenced in code:** ${referencedCount}/${totalCount}`);
lines.push(`**Used in UI (non-\`src/api\`):** ${usedInUiCount}/${totalCount}`);
lines.push(``);
lines.push(`## Summary table`);
lines.push(``);
lines.push(`| Path | Methods | Used in UI | Referenced | UI references | API references |`);
lines.push(`| --- | --- | --- | --- | --- | --- |`);

for (const r of results) {
  const uiRefs = r.uiHits.length
    ? r.uiHits
        .slice(0, 5)
        .map((h) => `\`${h.file}:${h.line}\``)
        .join("<br/>") + (r.uiHits.length > 5 ? `<br/>… +${r.uiHits.length - 5}` : "")
    : "";
  const apiHitsOnly = r.hitsAll.filter((h) => h.file.startsWith("src/api/"));
  const apiRefs = apiHitsOnly.length
    ? r.hitsAll
        .filter((h) => h.file.startsWith("src/api/"))
        .slice(0, 5)
        .map((h) => `\`${h.file}:${h.line}\``)
        .join("<br/>") +
      (apiHitsOnly.length > 5
        ? `<br/>… +${apiHitsOnly.length - 5}`
        : "")
    : "";

  lines.push(
    `| \`${r.path}\` | ${r.methods.join(", ") || "-"} | ${r.usedInUi ? "✅" : "❌"} | ${
      r.referencedInCode ? "✅" : "❌"
    } | ${uiRefs} | ${apiRefs} |`
  );
}

lines.push(``);
lines.push(`## Unused paths (UI)`);
lines.push(``);
for (const r of results.filter((x) => !x.usedInUi)) {
  lines.push(`- \`${r.path}\` (${r.methods.join(", ") || "-"})`);
}

lines.push(``);
lines.push(`## Notes`);
lines.push(``);
lines.push(
  `- This is a static source scan. It detects literal usage like \`'/api/x'\` and template literals like \`\`/api/x/\${id}\`\`.`
);
lines.push(`- If the backend gateway uses different routes (e.g. \`/api/shops\` vs \`/api/coffeeshop\`), OpenAPI may be outdated.`);
lines.push(``);

const outPath = path.join(repoRoot, "API_COVERAGE.md");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(
  `Wrote ${path.relative(repoRoot, outPath)} (${totalCount} paths, ${referencedCount} referenced, ${usedInUiCount} used in UI)`
);


