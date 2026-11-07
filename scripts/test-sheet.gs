/**
 * The test sheet's script: the Google Sheet where testers write the end-to-end test
 * procedures, one tab per procedure, and record their runs (docs/design/end-to-end-tests.md).
 *
 * It adds a Test procedures menu (a new procedure from the template, a new run, a rebuild of
 * the website now, and setting the sheet up), and keeps each procedure tab in order as it is
 * edited: the steps numbered, each row's dropdowns and colors, and each run's cells for steps
 * that are not in that run grayed out. It also asks GitHub to rebuild the website once edits
 * have stopped for six minutes, so site search catches up with the sheet. The website reads
 * the sheet live either way, and also rebuilds every hour.
 *
 * This file is the script's source: edit it in the repository, scripts/test-sheet.gs, then
 * paste it over Code.gs in the sheet (Extensions, Apps Script), save, and run setUp once.
 * Asking GitHub for a rebuild needs a fine-grained GitHub token with the Actions permission
 * on this repository only, in the script property GITHUB_TOKEN (Project settings, Script
 * properties). See "How this page stays current" in docs/design/end-to-end-tests.md.
 *
 * Google gives scripts no way to let a dropdown take more than one choice, or to show it as
 * chips. So the Applies when column's dropdown, which does both, is set by hand on the
 * Template tab (see "If Applies when stops taking more than one chip" in writeInstructions),
 * and this script copies it from there to each procedure's step rows and never builds it.
 */

const REPOSITORY = "STAR-Robotics-Team/starrt-luna-software";
const WORKFLOW = "docs.yml";
const SITE = "https://star-robotics-team.github.io/starrt-luna-software/";
// Edits stop for this long before the script asks for a rebuild. Google takes up to about
// five and a half minutes to publish an edit to every reader (measured November 2026), and a
// build that reads the sheet sooner can get the copy from before the edit.
const QUIET_MS = 6 * 60 * 1000;

const HOW_TO = "How to record a run";
const TEMPLATE = "Template";
// The tabs that list what the design registries define, imported from the website.
const REFERENCE = [
  ["Nodes", "design/registry/nodes.csv"],
  ["Interfaces", "design/registry/interfaces.csv"],
  ["TPMs", "design/registry/tpms.csv"],
  // Each hardware system's test modes, from the headings of docs/design/hardware-test-modes.md.
  ["Test modes", "design/registry/test-modes.csv"],
];
const COLUMNS = ["Row", "Do", "Pass when", "Applies when", "Actor", "Node", "Interface", "Budget", "Measures"];
// Column A fits the longest system name, Battery and power, beside its dropdown; Applies when
// fits the longest chip, Battery and power: Fake power panel, since chips cut text off.
const WIDTHS = [135, 360, 300, 250, 90, 150, 170, 70, 80];
// Row, Do, and Pass when stay in view while the run columns scroll.
const FROZEN = 3;
// A run's mode names, such as "Fake motor controllers (Sim)", wrap in its Result column.
const WRAPPED = ["do", "pass when", "applies when", "result", "note"];
// What a step names besides what to do and what to see: quieter, so the step reads first.
const QUIET = ["actor", "node", "interface", "budget", "measures"];
// The empty runs a new procedure starts with. Test procedures > Add a run adds more.
const RUNS = 3;
const RESULT_WIDTH = 160;
const NOTE_WIDTH = 180;
const KINDS = ["Date", "Log"];
const COLORS = {
  header: "#37474f", headerText: "#ffffff",
  run: "#e8eaf6",       // a run's date, its modes, and its log
  other: "#e0e0e0",     // a run's cells for a step that is not in that run
  quiet: "#5f6368",
  line: "#d9d9d9", edge: "#9e9e9e",
  pass: "#d9ead3", passText: "#1b5e20", fail: "#f4cccc", failText: "#9c1c1c",
};
const STATUS = "Rebuild on save:";

// ---------------------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Test procedures")
    .addItem("Add a run", "addRun")
    .addItem("New procedure...", "newProcedure")
    .addItem("Rebuild the website now", "rebuildNow")
    .addSeparator()
    .addItem("Set up or repair this sheet", "setUp")
    .addToUi();
}

/** A new procedure tab, copied from the template, named as the person asks. */
function newProcedure() {
  const ui = SpreadsheetApp.getUi();
  const book = SpreadsheetApp.getActive();
  const answer = ui.prompt("New procedure",
    "Its name, which is also its title on the website, such as \"The operator link drops\":", ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  const name = answer.getResponseText().replace(/\s+/g, " ").trim();
  if (!name) return;
  if (book.getSheetByName(name)) {
    ui.alert(`A tab is already called "${name}". Pick another name.`);
    return;
  }
  const sheet = (book.getSheetByName(TEMPLATE) || makeTemplate(book)).copyTo(book).setName(name);
  book.setActiveSheet(sheet);
  book.moveActiveSheet(book.getSheetByName(TEMPLATE).getIndex());
  tidy(sheet);
  sheet.getRange(1, 2).activate();
}

/**
 * Starts a run on the procedure tab in view: today's date in its first empty run, which it
 * adds when every run is used, and the cursor on the run's first mode.
 */
function addRun() {
  const ui = SpreadsheetApp.getUi();
  const book = SpreadsheetApp.getActive();
  const sheet = book.getActiveSheet();
  const header = headerRow(sheet);
  if (!header || sheet.getName() === TEMPLATE) {
    ui.alert("Open the tab of the procedure you are running, then choose Test procedures > Add a run.");
    return;
  }
  const lastRow = Math.max(sheet.getLastRow(), header + 1);
  const titles = titlesOf(sheet, header);
  const below = sheet.getRange(header + 1, 1, lastRow - header, sheet.getLastColumn()).getDisplayValues();
  const empty = (c) => c > titles.length || below.every((row) => !row[c - 1].trim());
  let column = titles.findIndex((t, i) => t === "result" && empty(i + 1) && (titles[i + 1] !== "note" || empty(i + 2))) + 1;
  if (!column) {
    column = sheet.getLastColumn() + 1;
    sheet.insertColumnsAfter(column - 1, 2);
    sheet.getRange(header, column, 1, 2).setValues([["Result", "Note"]]);
    tidy(sheet);
  }
  const kinds = below.map((row) => row[0].trim().toLowerCase());
  const systems = Object.keys(testModes(book).choices).map((s) => s.toLowerCase());
  const date = kinds.indexOf("date");
  if (date >= 0) {
    const today = Utilities.formatDate(new Date(), book.getSpreadsheetTimeZone(), "yyyy-MM-dd");
    sheet.getRange(header + 1 + date, column).setValue(today).setNumberFormat("yyyy-mm-dd");
  }
  const first = kinds.findIndex((k) => systems.includes(k));
  sheet.getRange(header + 1 + (first >= 0 ? first : Math.max(date, 0)), column).activate();
  // A script's own edits start no trigger, so note this one for the rebuild.
  PropertiesService.getScriptProperties().setProperty("LAST_EDIT", String(Date.now()));
}

function rebuildNow() {
  const result = askForRebuild();
  SpreadsheetApp.getUi().alert(result.ok
    ? "GitHub is rebuilding the website. It takes about two minutes."
    : `GitHub did not start a rebuild: ${result.why}`);
}

/**
 * Sets the sheet up, or repairs it: the reference tabs, the template, the instructions,
 * every procedure tab's numbers, dropdowns, and formatting, and the triggers that keep them
 * current and ask for rebuilds. Safe to run again at any time.
 */
function setUp() {
  const book = SpreadsheetApp.getActive();
  for (const [name, path] of REFERENCE) {
    const sheet = book.getSheetByName(name) || book.insertSheet(name, book.getNumSheets());
    // Google keeps an import's result for an address, even a "not found", so a broken import is
    // asked for at a new address; the website ignores the ?v= part. A working one is left alone,
    // so its list stays filled while the dropdowns below are built from it.
    const cell = sheet.getRange("A1");
    if (!cell.getFormula().includes(`${SITE}${path}`) || cell.getDisplayValue().startsWith("#")) {
      cell.setFormula(`=IMPORTDATA("${SITE}${path}?v=${Date.now()}")`);
    }
    sheet.getRange("1:1").setFontWeight("bold").setBackground(COLORS.header).setFontColor(COLORS.headerText);
    sheet.setFrozenRows(1);
    sheet.setTabColor("#9e9e9e");
  }
  if (!book.getSheetByName(TEMPLATE)) makeTemplate(book);
  writeInstructions(book);
  for (const sheet of book.getSheets()) {
    const header = headerRow(sheet);
    if (!header) continue;
    if (sheet.getName() !== TEMPLATE) copyAppliesWhen(book, sheet, header);
    tidy(sheet);
  }
  // The instructions first; the template and the reference tabs last.
  book.setActiveSheet(book.getSheetByName(HOW_TO));
  book.moveActiveSheet(1);
  SpreadsheetApp.flush();
  for (const name of [TEMPLATE, ...REFERENCE.map(([n]) => n)]) {
    book.setActiveSheet(book.getSheetByName(name));
    book.moveActiveSheet(book.getNumSheets());
  }
  book.setActiveSheet(book.getSheetByName(HOW_TO));
  for (const trigger of ScriptApp.getProjectTriggers()) ScriptApp.deleteTrigger(trigger);
  ScriptApp.newTrigger("recordEdit").forSpreadsheet(book).onEdit().create();
  ScriptApp.newTrigger("recordChange").forSpreadsheet(book).onChange().create();
  ScriptApp.newTrigger("rebuildAfterEdits").timeBased().everyMinutes(1).create();
  if (!PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN")) {
    setStatus(`${STATUS} off, because the script has no GitHub token yet. The website still reads this sheet ` +
      "live, and rebuilds every hour. To turn it on, see \"How this page stays current\" on the website's " +
      "End-to-end test procedures page.");
  }
}

// ---------------------------------------------------------------------------------------
// Keeping the tabs in order, and rebuilding the website
// ---------------------------------------------------------------------------------------

/**
 * On every edit: note when it happened, and put the tab in order again, unless the edit is
 * only marks or notes on steps, which change nothing else.
 */
function recordEdit(e) {
  PropertiesService.getScriptProperties().setProperty("LAST_EDIT", String(Date.now()));
  const sheet = e.range.getSheet();
  const header = headerRow(sheet);
  if (!header || e.range.getLastRow() <= header) return;
  const titles = titlesOf(sheet, header);
  const first = Math.max(e.range.getRow(), header + 1);
  if (e.range.getColumn() > titles.indexOf("measures") + 1) {
    const labels = sheet.getRange(first, 1, e.range.getLastRow() - first + 1, 1).getDisplayValues();
    if (labels.every(([v]) => /^([0-9]*|step)$/i.test(v.trim()))) return;
  }
  tidyRows(sheet, header);
}

/** On a change edits don't cover, such as a row added or removed: the same as an edit. */
function recordChange(e) {
  if (e.changeType === "EDIT" || e.changeType === "FORMAT") return;
  PropertiesService.getScriptProperties().setProperty("LAST_EDIT", String(Date.now()));
  const sheet = e.source.getActiveSheet();
  const header = headerRow(sheet);
  if (header) tidyRows(sheet, header);
}

/** Every minute: once edits have stopped for QUIET_MS, ask GitHub for one rebuild. */
function rebuildAfterEdits() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const properties = PropertiesService.getScriptProperties();
    const edited = Number(properties.getProperty("LAST_EDIT") || 0);
    const asked = Number(properties.getProperty("LAST_REBUILD") || 0);
    if (edited <= asked || Date.now() - edited < QUIET_MS) return;
    properties.setProperty("LAST_REBUILD", String(Date.now()));
    askForRebuild();
  } finally {
    lock.releaseLock();
  }
}

/** Ask GitHub to run the website's workflow on main; {ok, why}. */
function askForRebuild() {
  const token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) {
    setStatus(`${STATUS} off, because the script has no GitHub token. The website still reads this sheet ` +
      "live, and rebuilds every hour.");
    return {ok: false, why: "the script has no GitHub token (script property GITHUB_TOKEN)."};
  }
  // The time zone is the spreadsheet's (File, Settings), so name it.
  const when = Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "MMM d, h:mm a z");
  let response;
  try {
    response = UrlFetchApp.fetch(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "post",
      contentType: "application/json",
      headers: {Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"},
      payload: JSON.stringify({ref: "main"}),
      muteHttpExceptions: true,
    });
  } catch (error) {
    const why = `the request to GitHub failed (${error.message}).`;
    setStatus(`${STATUS} not working since ${when}: ${why} The website still reads this sheet live, and rebuilds every hour.`);
    return {ok: false, why};
  }
  if (response.getResponseCode() === 204) {
    setStatus(`${STATUS} working. The last rebuild was asked for on ${when}.`);
    return {ok: true};
  }
  let message = response.getContentText();
  try {
    message = JSON.parse(message).message || message;
  } catch (error) {
    // Not JSON: keep the text.
  }
  const why = `GitHub answered ${response.getResponseCode()} (${String(message).slice(0, 200)}).`;
  setStatus(`${STATUS} not working since ${when}: ${why} The website still reads this sheet live, and rebuilds ` +
    "every hour. If the token expired, renew it: see \"How this page stays current\" on the website's " +
    "End-to-end test procedures page.");
  return {ok: false, why};
}

function setStatus(text) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(HOW_TO);
  if (!sheet) return;
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues();
  let row = values.findIndex(([v]) => String(v).startsWith(STATUS)) + 1;
  if (!row) row = sheet.getLastRow() + 2;
  if (sheet.getRange(row, 1).getValue() !== text) sheet.getRange(row, 1).setValue(text);
}

// ---------------------------------------------------------------------------------------
// The tabs
// ---------------------------------------------------------------------------------------

/** The header row's number, or 0 when the tab is not a procedure. */
function headerRow(sheet) {
  const last = Math.min(sheet.getLastRow(), 20);
  if (last < 1) return 0;
  const values = sheet.getRange(1, 1, last, Math.max(sheet.getLastColumn(), 1)).getDisplayValues();
  const i = values.findIndex((row) => row[0].trim().toLowerCase() === "row" &&
    row.some((v) => v.trim().toLowerCase() === "do"));
  return i + 1;
}

/** The header row's titles, lowercase. */
function titlesOf(sheet, header) {
  return sheet.getRange(header, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map((v) => v.trim().toLowerCase());
}

function makeTemplate(book) {
  const sheet = book.insertSheet(TEMPLATE, book.getNumSheets());
  const header = [...COLUMNS];
  for (let i = 0; i < RUNS; i++) header.push("Result", "Note");
  if (sheet.getMaxColumns() < header.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), header.length - sheet.getMaxColumns());
  }
  const rows = [["Purpose"], header, ["Date"], [""], [""], ...new Array(10).fill([""]), ["Log"]];
  rows.forEach((row, i) => sheet.getRange(i + 1, 1, 1, row.length).setValues([row]));
  sheet.getRange(1, 2).setNote("What this procedure checks, and the requirements it comes from.");
  sheet.getRange(4, 1).setNote("One row for each hardware system the procedure uses: pick its name in column A. " +
    "Each run then picks that system's mode.");
  sheet.getRange(6, 2).setNote("One row for each step, in the order it happens, from setting up to tearing down. " +
    "The script numbers the steps in column A.");
  // Applies when's dropdown on the rows for steps, with one choice: a person then makes it
  // chips that take several.
  const modes = book.getSheetByName("Test modes");
  if (modes) {
    sheet.getRange(4, COLUMNS.indexOf("Applies when") + 1, rows.length - 4, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(modes.getRange("E2:E"), true).setAllowInvalid(true).build());
  }
  tidy(sheet);
  return sheet;
}

/** The lowercase names column A gives a run's rows: Date, Log, and each hardware system. */
function runKinds(book) {
  return new Set(["date", "log", ...Object.keys(testModes(book).choices).map((s) => s.toLowerCase())]);
}

/**
 * Gives a procedure tab's rows for steps the Template's Applies when dropdown, which takes
 * several chips, and takes it off every other row. Google lets only a person make that
 * dropdown, so the script copies it, from the Template's first row for a step, rather than
 * building it.
 */
function copyAppliesWhen(book, sheet, header) {
  const template = book.getSheetByName(TEMPLATE);
  const from = template && headerRow(template);
  const source = from && titlesOf(template, from).indexOf("applies when") + 1;
  const target = titlesOf(sheet, header).indexOf("applies when") + 1;
  if (!source || !target) return;
  const run = runKinds(book);
  const kinds = (s, h) => s.getRange(h + 1, 1, Math.max(s.getLastRow() - h, 1), 1).getDisplayValues()
    .map(([v]) => v.trim().toLowerCase());
  const first = kinds(template, from).findIndex((k) => !run.has(k));
  if (first < 0) return;
  const rule = template.getRange(from + 1 + first, source);
  sheet.getRange(header + 1, target, sheet.getMaxRows() - header, 1).clearDataValidations();
  const rows = kinds(sheet, header);
  for (let i = 0; i < rows.length; i++) {
    if (run.has(rows[i])) continue;
    let end = i;
    while (end + 1 < rows.length && !run.has(rows[end + 1])) end++;
    rule.copyTo(sheet.getRange(header + 1 + i, target, end - i + 1, 1), SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    i = end;
  }
}

/** A procedure tab's layout: frozen header, column widths, fonts, run edges, and colors. */
function tidy(sheet) {
  const header = headerRow(sheet);
  if (!header) return;
  const lastColumn = sheet.getLastColumn();
  const rows = Math.max(sheet.getMaxRows() - header, 1);
  // A merge may not cross the frozen columns' edge, so undo any above the header first.
  if (header > 1) sheet.getRange(1, 1, header - 1, lastColumn).breakApart();
  sheet.setFrozenRows(header);
  sheet.setFrozenColumns(FROZEN);
  sheet.setHiddenGridlines(true);
  WIDTHS.forEach((width, i) => sheet.setColumnWidth(i + 1, width));
  const titles = titlesOf(sheet, header);
  const results = [];
  titles.forEach((title, i) => {
    const below = sheet.getRange(header + 1, i + 1, rows, 1);
    if (title === "result") {
      results.push(i + 1);
      sheet.setColumnWidth(i + 1, RESULT_WIDTH);
      below.setHorizontalAlignment("left");
    } else if (title === "note") {
      sheet.setColumnWidth(i + 1, NOTE_WIDTH);
    }
    if (WRAPPED.includes(title)) below.setWrap(true);
    if (QUIET.includes(title)) below.setFontColor(COLORS.quiet).setFontSize(10);
  });
  sheet.getRange(1, 1, sheet.getMaxRows(), lastColumn).setVerticalAlignment("top");
  // Step numbers line up with the names of the run's rows above them.
  sheet.getRange(header + 1, 1, rows, 1).setHorizontalAlignment("left");
  sheet.getRange(header, 1, 1, lastColumn).setFontWeight("bold").setBackground(COLORS.header)
    .setFontColor(COLORS.headerText);
  for (let row = 1; row < header; row++) {
    if (sheet.getRange(row, 1).getDisplayValue().trim().toLowerCase() === "purpose") {
      // Across the frozen columns, so the purpose stays in view beside the runs.
      const purpose = sheet.getRange(row, 2, 1, FROZEN - 1);
      if (!purpose.isPartOfMerge()) purpose.merge();
      purpose.setWrap(true);
      sheet.getRange(row, 1).setFontWeight("bold");
    }
  }
  const marks = results.map((c) => sheet.getRange(header + 1, c, rows, 1));
  sheet.setConditionalFormatRules(marks.length ? [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Pass").setBackground(COLORS.pass)
      .setFontColor(COLORS.passText).setRanges(marks).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Fail").setBackground(COLORS.fail)
      .setFontColor(COLORS.failText).setRanges(marks).build(),
  ] : []);
  tidyRows(sheet, header);
}

/**
 * Each hardware system's mode choices for a run, such as "One computer (Sim)", and each
 * Applies when chip as the Test modes tab writes it, such as "Radio link: Bench", by its
 * lowercase text.
 */
function testModes(book) {
  const sheet = book.getSheetByName("Test modes");
  const choices = {};
  const chips = {};
  if (!sheet || sheet.getLastRow() < 2) return {choices, chips};
  for (const [system, , , choice, chip] of sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getDisplayValues()) {
    if (system && choice) (choices[system] = choices[system] || []).push(choice);
    if (chip) chips[chip.toLowerCase()] = chip;
  }
  return {choices, chips};
}

/** A mode as a run or a chip writes it, without its layer, in lowercase. */
function modeKey(text) {
  return text.trim().replace(/\s*\((?:Sim|Bench|Robot)\)$/, "").toLowerCase();
}

/**
 * Applies when as chips: "Radio link: Bench, Drive base" is "Radio link: Bench, Radio link:
 * Drive base", each chip spelled as in the Test modes tab.
 */
function asChips(text, chips) {
  let system = "";
  return text.split(",").map((c) => c.trim()).filter(Boolean).map((chip) => {
    const at = chip.indexOf(":");
    if (at >= 0) system = chip.slice(0, at).trim();
    const full = at >= 0 ? `${system}: ${chip.slice(at + 1).trim()}` : system ? `${system}: ${chip}` : chip;
    const key = full.toLowerCase().replace(/\s*\((?:sim|bench|robot)\)$/, "");
    return chips[key] || full;
  }).join(", ");
}

/**
 * Puts every row below a procedure tab's header in order, in a few calls: numbers the
 * steps, writes Applies when as chips, and sets each cell's dropdown, color, and lines by
 * its row's kind. A run's Result and Note for a step that is not in that run are grayed
 * out, without a dropdown; a step is in a run unless it applies only to other modes of a
 * system the run has picked a mode for.
 */
function tidyRows(sheet, header) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= header) return;
  const book = sheet.getParent();
  const count = lastRow - header;
  const lastColumn = sheet.getLastColumn();
  const titles = titlesOf(sheet, header);
  const column = (name) => titles.indexOf(name) + 1;
  const applies = column("applies when");
  const stepColumns = column("measures") || COLUMNS.length;
  const results = titles.map((t, i) => (t === "result" ? i + 1 : 0)).filter(Boolean);
  const notes = new Set(results.filter((c) => titles[c] === "note").map((c) => c + 1));
  const {choices, chips} = testModes(book);
  const systems = Object.keys(choices);
  const range = sheet.getRange(header + 1, 1, count, lastColumn);
  const values = range.getDisplayValues();

  // Each row's kind: "date", "log", "system", "step", or "" for an empty row.
  const rows = values.map((row) => {
    const typed = row[0].trim().toLowerCase();
    if (typed === "date" || typed === "log") return {kind: typed};
    const system = systems.find((s) => s.toLowerCase() === typed);
    if (system) return {kind: "system", system};
    const used = row.slice(1, stepColumns).some((v) => v.trim());
    return {kind: used && /^([0-9]*|step)$/.test(typed) ? "step" : ""};
  });

  // Column A: each step's number, written only from the first number that changed to the
  // last, so an edit made meanwhile elsewhere in the column stays.
  let step = 0;
  const labels = values.map((row, i) => [rows[i].kind === "step" ? ++step : row[0]]);
  const changed = labels.map(([v], i) => String(v) !== values[i][0]);
  const start = changed.indexOf(true);
  if (start >= 0) {
    const end = changed.lastIndexOf(true);
    sheet.getRange(header + 1 + start, 1, end - start + 1, 1).setValues(labels.slice(start, end + 1));
  }
  // Applies when: chips.
  if (applies) {
    values.forEach((row, i) => {
      if (rows[i].kind !== "step" || !row[applies - 1].trim()) return;
      const chipped = asChips(row[applies - 1], chips);
      if (chipped !== row[applies - 1]) {
        sheet.getRange(header + 1 + i, applies).setValue(chipped);
        row[applies - 1] = chipped;
      }
    });
  }

  // Each run's modes, and whether each step is in it.
  const runModes = new Map(results.map((c) => [c, {}]));
  values.forEach((row, i) => {
    if (rows[i].kind !== "system") return;
    for (const c of results) if (row[c - 1].trim()) runModes.get(c)[rows[i].system.toLowerCase()] = modeKey(row[c - 1]);
  });
  const wanted = values.map((row) => {
    const modes = {};
    for (const chip of (applies ? row[applies - 1] : "").split(",")) {
      const at = chip.indexOf(":");
      if (at < 0) continue;
      const system = chip.slice(0, at).trim().toLowerCase();
      (modes[system] = modes[system] || []).push(modeKey(chip.slice(at + 1)));
    }
    return Object.entries(modes);
  });
  const inRun = (i, c) => {
    const picked = runModes.get(c);
    return wanted[i].every(([system, modes]) => !picked[system] || modes.includes(picked[system]));
  };

  const list = (items) => SpreadsheetApp.newDataValidation().requireValueInList(items, true).setAllowInvalid(true).build();
  const from = (tab, a1) => {
    const reference = book.getSheetByName(tab);
    return reference ? SpreadsheetApp.newDataValidation()
      .requireValueInRange(reference.getRange(a1), true).setAllowInvalid(true).build() : null;
  };
  const modeRules = {};
  for (const system of systems) modeRules[system] = list(choices[system]);
  const passFail = list(["Pass", "Fail"]);
  const date = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build();
  const stepLists = {[column("node")]: from("Nodes", "A2:A"), [column("interface")]: from("Interfaces", "A2:A"),
    [column("budget")]: from("TPMs", "A2:A"), [column("measures")]: from("TPMs", "A2:A")};
  const kindRule = list([...KINDS, ...systems]);
  const validations = [];
  const backgrounds = [];
  values.forEach((row, i) => {
    const {kind, system} = rows[i];
    const measures = column("measures") ? row[column("measures") - 1].trim() : "";
    const rule = [];
    const fill = [];
    for (let c = 1; c <= lastColumn; c++) {
      const run = results.includes(c) ? c : notes.has(c) ? c - 1 : 0;
      const out = kind === "step" && run && !inRun(i, run);
      // A step that measures a TPM takes Pass, Fail, or the measured number, so no dropdown.
      if (c === 1) rule.push(kind === "step" ? null : kindRule);
      else if (kind === "step" && stepLists[c] !== undefined) rule.push(stepLists[c]);
      else if (kind === "step" && results.includes(c)) rule.push(out || measures ? null : passFail);
      else if (kind === "date" && results.includes(c)) rule.push(date);
      else if (kind === "system" && results.includes(c)) rule.push(modeRules[system]);
      else rule.push(null);
      fill.push(kind === "date" || kind === "log" || kind === "system" ? COLORS.run : out ? COLORS.other : "#ffffff");
    }
    validations.push(rule);
    backgrounds.push(fill);
  });
  // Applies when keeps its own dropdown, copied from the Template: set the columns either side,
  // and take it off the run's rows, which a row inserted beside them can copy it to.
  const set = (first, last) => {
    if (last < first) return;
    sheet.getRange(header + 1, first, count, last - first + 1)
      .setDataValidations(validations.map((r) => r.slice(first - 1, last)));
  };
  if (applies) {
    set(1, applies - 1);
    set(applies + 1, lastColumn);
    const runCells = rows.map((r, i) => (["date", "log", "system"].includes(r.kind) ? i : -1)).filter((i) => i >= 0)
      .map((i) => sheet.getRange(header + 1 + i, applies).getA1Notation());
    if (runCells.length) sheet.getRangeList(runCells).clearDataValidations();
  } else set(1, lastColumn);
  range.setBackgrounds(backgrounds);

  // Lines: a light one between rows and columns, a heavier one where the run's rows meet
  // the steps, and each run's left edge.
  const solid = SpreadsheetApp.BorderStyle.SOLID;
  const medium = SpreadsheetApp.BorderStyle.SOLID_MEDIUM;
  range.setBorder(false, false, false, false, false, false);
  range.setBorder(null, null, true, null, true, true, COLORS.line, solid);
  const isRun = (i) => ["date", "log", "system"].includes(rows[i].kind);
  for (let i = 0; i + 1 < count; i++) {
    if (isRun(i) !== isRun(i + 1)) {
      sheet.getRange(header + 1 + i, 1, 1, lastColumn).setBorder(null, null, true, null, null, null, COLORS.edge, medium);
    }
  }
  for (const c of results) {
    sheet.getRange(header, c, count + 1, 1).setBorder(null, true, null, null, null, null, COLORS.edge, medium);
  }
}

function writeInstructions(book) {
  const sheet = book.getSheetByName(HOW_TO) || book.insertSheet(HOW_TO, 0);
  const status = sheet.getDataRange().getDisplayValues().map(([v]) => v).find((v) => v.startsWith(STATUS));
  const lines = [
    ["How to record a run", true],
    ["1. Open the procedure's tab and choose Test procedures > Add a run. It puts today's date at the top of the first empty pair of Result and Note columns, adding a pair when none is left."],
    ["2. Pick each hardware system's mode in the rows under Date. The cells of steps that are not in this run then turn gray: skip those steps."],
    ["3. Follow the steps in order. Mark each one Pass or Fail as you go. For a step that measures a TPM, you can type the measured number instead, in the TPM's unit."],
    ["4. Link the log in the Log row, and write a note beside any row, in its Note column."],
    [`The website shows each procedure with only the steps for the modes you pick, and each run's marks beside its steps: ${SITE}design/end-to-end-tests/`],
    [""],
    ["How to write a procedure", true],
    ["Test procedures > New procedure copies the Template tab under the name you give. The name is the procedure's title on the website."],
    ["Write its purpose at the top. Under Date, add a row for each hardware system the procedure uses, with its name from the dropdown in column A."],
    ["Then write each step on its own row, in the order it happens, from setting up to tearing down. Do says exactly what to do, where, and with which tool or command; Pass when says exactly what must be seen, where, and within what limit. The script numbers the steps in column A: leave those numbers to it."],
    ["Applies when limits a step to some modes. Pick one or more chips, such as Radio link: Bench and Radio link: Drive base. Chips for the same system mean any of those modes; chips for different systems mean all of them. Leave it blank for a step in every run."],
    ["Pick nodes, interfaces, TPMs, and modes from the dropdowns. They come from the design registries and Hardware test modes, in the Nodes, Interfaces, TPMs, and Test modes tabs, which the website keeps current."],
    ["To add a step, insert a row where it happens. To add a run, use Test procedures > Add a run."],
    ["If Applies when stops taking more than one chip: on the Template tab, click Applies when in the first row under Date, choose Data > Data validation, and click its rule. Under Advanced options, set Display style to Chip; tick Allow multiple selections; choose Done. Then choose Test procedures > Set up or repair this sheet, which copies it to every procedure. Google lets only a person set these."],
    [""],
    ["The website", true],
    [`The website shows every procedure tab live: ${SITE}design/end-to-end-tests/`],
    ["Google takes up to about 5 minutes to publish an edit, so the website shows it a few minutes later."],
    ["The website also rebuilds once edits have stopped for six minutes, so site search finds new text, and every hour."],
    ["This tab is rewritten by Test procedures > Set up or repair this sheet: edit scripts/test-sheet.gs in the repository instead."],
    [""],
  ];
  sheet.clear();
  lines.forEach(([text, bold], i) => {
    const cell = sheet.getRange(i + 1, 1).setValue(text);
    if (bold) cell.setFontWeight("bold");
  });
  if (status) sheet.getRange(lines.length + 1, 1).setValue(status);
  sheet.setColumnWidth(1, 900);
  sheet.getRange(1, 1, lines.length + 1, 1).setWrap(true);
}
