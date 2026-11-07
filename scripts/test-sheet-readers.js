#!/usr/bin/env node
// Checks that the website's reader of the test sheet (docs/javascripts/test-sheet.js) reads
// a sheet exactly as the build's reader (read_sheet in scripts/design) does: the same
// procedures, runs, and problems. The two must agree, or a page would show the sheet
// differently once it reads it live than the build's copy did, and the check would pass
// procedures the website flags.
//
//   node scripts/test-sheet-readers.js [file.xlsx]
//
// Reads scripts/test-sheet-sample.xlsx by default: a sample sheet exported by Google
// Sheets, with runs and mistakes of every kind each reader reports. Needs Node 20.12 or
// newer and Python 3.11 or newer. CI runs it on every pull request (.github/workflows/design.yml).
"use strict";

const assert = require("node:assert");
const {execFileSync} = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repo = path.resolve(__dirname, "..");
const file = process.argv[2] || path.join(repo, "scripts", "test-sheet-sample.xlsx");
const reader = require(path.join(repo, "docs", "javascripts", "test-sheet.js"));

async function main() {
  const python = JSON.parse(execFileSync("python3", [path.join(repo, "scripts", "design"), "sheet-json", file],
    {encoding: "utf-8", stdio: ["ignore", "pipe", "inherit"]}));
  const javascript = reader.readSheet(await reader.readXlsx(fs.readFileSync(file)), python.ids);
  try {
    assert.deepStrictEqual(javascript, python.sheet);
  } catch (error) {
    console.error(`The two readers read ${path.relative(repo, file)} differently.`);
    console.error("Expected is scripts/design; actual is docs/javascripts/test-sheet.js.\n");
    console.error(error.message);
    process.exit(1);
  }
  const procedures = python.sheet.procedures;
  const runs = procedures.reduce((n, p) => n + p.runs.length, 0);
  const problems = procedures.reduce((n, p) => n + p.problems.length, python.sheet.problems.length);
  console.log(`OK: both readers read ${procedures.length} procedures, ${runs} runs, and ${problems} problems ` +
    `the same way from ${path.relative(repo, file)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
