#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const literalAssignmentPattern = /(?:"([A-Za-z_][A-Za-z0-9_-]*)"|'([A-Za-z_][A-Za-z0-9_-]*)'|([A-Za-z_][A-Za-z0-9_-]*))\s*(?:=|:)\s*(["'])[^"'\r\n]{6,}\4/g;
const unquotedConfigAssignmentPattern = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_-]*)\s*[=:]\s*([^\s#,'"}\]]{6,})\s*$/gm;
const tokenPatterns = [
  ["JWT-like token", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g],
  ["Stripe secret", /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ["Stripe webhook secret", /\bwhsec_[A-Za-z0-9]{16,}\b/g]
];
const generatedLockfiles = new Set([
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml"
]);

function isSensitiveIdentifier(identifier) {
  const normalized = identifier.toLowerCase().replace(/[^a-z0-9]/g, "");
  const genericKeyNames = [
    "servicerolekey",
    "secretkey",
    "privatekey",
    "signingkey",
    "accesskey"
  ];
  return normalized.includes("password")
    || normalized.includes("passwd")
    || normalized.endsWith("secret")
    || normalized.endsWith("token")
    || normalized.endsWith("apikey")
    || genericKeyNames.some((name) => normalized.endsWith(name))
    || normalized === "key";
}

export function findSecretViolations(source, filename) {
  const violations = [];
  const record = (rule, index) => {
    const line = source.slice(0, index).split("\n").length;
    violations.push({ filename, line, rule });
  };

  for (const match of source.matchAll(literalAssignmentPattern)) {
    if (isSensitiveIdentifier(match[1] ?? match[2] ?? match[3])) {
      record("literal sensitive assignment", match.index);
    }
  }
  if (/(?:^|\/)\.env(?:\.|$)|\.(?:sh|ya?ml)$|(?:^|\/)Dockerfile$/i.test(filename)) {
    for (const match of source.matchAll(unquotedConfigAssignmentPattern)) {
      const value = match[2];
      if (isSensitiveIdentifier(match[1]) && !/^(?:\$|process\.env|import\.meta\.env|Deno\.env|Bun\.env)/.test(value)) {
        record("literal sensitive assignment", match.index);
      }
    }
  }
  for (const [rule, pattern] of tokenPatterns) {
    for (const match of source.matchAll(pattern)) {
      record(rule, match.index);
    }
  }
  return violations;
}

function gitCandidateFiles(cwd) {
  return execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    cwd,
    encoding: "utf8"
  }).split("\0").filter(Boolean);
}

export function scanRepository({
  cwd = process.cwd(),
  listFiles = () => gitCandidateFiles(cwd),
  readFile = (filename) => readFileSync(join(cwd, filename))
} = {}) {
  const violations = [];

  for (const filename of listFiles()) {
    if (generatedLockfiles.has(filename) || generatedLockfiles.has(filename.split("/").at(-1))) {
      continue;
    }

    let contents;
    try {
      contents = readFile(filename);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Unable to scan ${filename}: ${detail}`);
    }

    const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
    if (buffer.includes(0)) continue;
    violations.push(...findSecretViolations(buffer.toString("utf8"), filename));
  }

  return violations;
}

function main() {
  let violations;
  try {
    violations = scanRepository();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (violations.length) {
    for (const violation of violations) {
      console.error(`${violation.filename}:${violation.line}: ${violation.rule}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Secret regression scan passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
