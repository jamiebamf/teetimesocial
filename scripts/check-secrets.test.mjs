import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findSecretViolations, scanRepository } from "./check-secrets.mjs";

describe("findSecretViolations", () => {
  it("rejects a literal shared admin password", () => {
    const name = `ADMIN_PASS${"WORD"}`;
    expect(findSecretViolations(`const ${name} = "example-only";`, "src/App.tsx")).toHaveLength(1);
  });

  it("rejects a service-role JWT embedded in source", () => {
    const fakeJwt = `eyJ${"a".repeat(36)}.${"b".repeat(36)}.${"c".repeat(36)}`;
    const name = `SUPABASE_SERVICE_ROLE_${"KEY"}`;
    const violations = findSecretViolations(`const ${name} = "${fakeJwt}";`, "src/config.ts");
    expect(violations.some((violation) => violation.rule === "JWT-like token")).toBe(true);
  });

  it("rejects alternate and generic credential assignment names", () => {
    const suffix = "word";
    const source = [
      `const adminPass${suffix} = "example-only";`,
      `PASS${suffix.toUpperCase()}='another-example';`,
      `config.database_pass${suffix} = "third-example";`
    ].join("\n");

    expect(findSecretViolations(source, "config/custom.txt")).toHaveLength(3);
  });

  it("normalizes separators and casing in credential identifiers", () => {
    const suffix = ["pass", "word"].join("");
    const source = `"Admin-${suffix.toUpperCase()}": "example-only"`;

    expect(findSecretViolations(source, "config/custom.json")).toHaveLength(1);
  });

  it("rejects normalized generic key credential identifiers", () => {
    const names = [
      ["SERVICE", "ROLE", "KEY"].join("_"),
      ["secret", "key"].join("_"),
      ["Private", "Key"].join("-"),
      ["signing", "Key"].join(""),
      ["ACCESS", "KEY"].join("_")
    ];
    const source = names.map((name, index) => `const ${name} = "fixture-value-${index}";`).join("\n");

    expect(findSecretViolations(source, "config/credentials.ts")).toHaveLength(names.length);
  });

  it("rejects unquoted environment-style credential assignments", () => {
    const name = ["PASS", "WORD"].join("");

    expect(findSecretViolations(`${name}=example-only`, ".env.local")).toHaveLength(1);
  });

  it("allows environment-variable references", () => {
    expect(findSecretViolations("const key = import.meta.env.VITE_SUPABASE_ANON_KEY;", "src/config.ts")).toEqual([]);
  });
});

describe("scanRepository", () => {
  it("scans tracked text files outside source path whitelists", () => {
    const cwd = mkdtempSync(join(tmpdir(), "tts-secret-scan-"));
    execFileSync("git", ["init", "-q"], { cwd });
    const name = `adminPass${"word"}`;
    writeFileSync(join(cwd, "deployment-notes.txt"), `${name} = "example-only";`);
    execFileSync("git", ["add", "deployment-notes.txt"], { cwd });

    expect(scanRepository({ cwd })).toMatchObject([
      { filename: "deployment-notes.txt", rule: "literal sensitive assignment" }
    ]);
  });

  it("fails closed when a candidate file cannot be read", () => {
    expect(() => scanRepository({
      cwd: ".",
      listFiles: () => ["unreadable.txt"],
      readFile: () => { throw new Error("permission denied"); }
    })).toThrow(/unreadable\.txt.*permission denied/);
  });

  it("skips binary content and generated dependency lockfiles only", () => {
    const readFile = (filename) => filename === "image.dat"
      ? Buffer.from([0, 1, 2])
      : Buffer.from(`const pass${"word"} = "example-only";`);

    expect(scanRepository({
      cwd: ".",
      listFiles: () => ["image.dat", "package-lock.json"],
      readFile
    })).toEqual([]);
  });
});
