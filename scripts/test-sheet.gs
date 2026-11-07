/**
 * The test sheet's script: the Google Sheet where testers write the end-to-end test
 * procedures, one tab per procedure, and record their runs (docs/design/end-to-end-tests.md).
 *
 * It adds a Test procedures menu (a new procedure from the template, a rebuild of the
 * website now, and setting the sheet up), keeps each procedure tab's dropdowns and
 * formatting in step with its rows, and asks GitHub to rebuild the website once edits have
 * stopped for six minutes, so site search catches up with the sheet. The website reads the sheet live
 * either way, and also rebuilds every hour.
 *
 * This file is the script's source: edit it in the repository, scripts/test-sheet.gs, then
 * paste it over Code.gs in the sheet (Extensions, Apps Script), save, and run setUp once.
 * Asking GitHub for a rebuild needs a fine-grained GitHub token with the Actions permission
 * on this repository only, in the script property GITHUB_TOKEN (Project settings, Script
 * properties). See "How this page stays current" in docs/design/end-to-end-tests.md.
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
const WIDTHS = [110, 360, 300, 190, 90, 150, 170, 70, 80];
// Row, Do, and Pass when stay in view while the run columns scroll.
const FROZEN = 3;
const WRAPPED = ["do", "pass when", "applies when", "note"];
const RUNS = 10;
const RESULT_WIDTH = 95;
const NOTE_WIDTH = 200;
const KINDS = ["Step", "Date", "Log"];
const COLORS = {header: "#e8eaf6", Date: "#f3f3f3", Log: "#f3f3f3", system: "#f3f3f3"};
const STATUS = "Rebuild on save:";

// ---------------------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Test procedures")
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

function rebuildNow() {
  const result = askForRebuild();
  SpreadsheetApp.getUi().alert(result.ok
    ? "GitHub is rebuilding the website. It takes about two minutes."
    : `GitHub did not start a rebuild: ${result.why}`);
}

/**
 * Sets the sheet up, or repairs it: the reference tabs, the template, the instructions,
 * every procedure tab's dropdowns and formatting, and the triggers that keep them current
 * and ask for rebuilds. Safe to run again at any time.
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
    sheet.getRange("1:1").setFontWeight("bold").setBackground(COLORS.header);
    sheet.setFrozenRows(1);
    sheet.setTabColor("#9e9e9e");
  }
  if (!book.getSheetByName(TEMPLATE)) makeTemplate(book);
  writeInstructions(book);
  for (const sheet of book.getSheets()) {
    if (headerRow(sheet)) tidy(sheet);
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
  ScriptApp.newTrigger("rebuildAfterEdits").timeBased().everyMinutes(1).create();
  if (!PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN")) {
    setStatus(`${STATUS} off, because the script has no GitHub token yet. The website still reads this sheet ` +
      "live, and rebuilds every hour. To turn it on, see \"How this page stays current\" on the website's " +
      "End-to-end test procedures page.");
  }
}

// ---------------------------------------------------------------------------------------
// Rebuilding the website
// ---------------------------------------------------------------------------------------

/** On every edit: note when it happened, and fix a row's dropdowns if its kind or Measures changed. */
function recordEdit(e) {
  PropertiesService.getScriptProperties().setProperty("LAST_EDIT", String(Date.now()));
  const sheet = e.range.getSheet();
  const header = headerRow(sheet);
  if (!header || e.range.getLastRow() <= header) return;
  const titles = sheet.getRange(header, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map((v) => v.trim().toLowerCase());
  const measures = titles.indexOf("measures") + 1;
  if (e.range.getColumn() === 1 || (measures && e.range.getColumn() <= measures && e.range.getLastColumn() >= measures)) {
    const first = Math.max(e.range.getRow(), header + 1);
    tidyRows(sheet, header, first, e.range.getLastRow() - first + 1);
  }
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

function makeTemplate(book) {
  const sheet = book.insertSheet(TEMPLATE, book.getNumSheets());
  const header = [...COLUMNS];
  for (let i = 0; i < RUNS; i++) header.push("Result", "Note");
  // A new tab has 26 columns; the header needs more.
  if (sheet.getMaxColumns() < header.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), header.length - sheet.getMaxColumns());
  }
  const rows = [["Purpose"], header, ["Date"], [""], [""], ["Step"], ["Step"], ["Step"], ["Step"], ["Step"],
    ["Step"], ["Step"], ["Step"], ["Step"], ["Step"], ["Log"]];
  rows.forEach((row, i) => sheet.getRange(i + 1, 1, 1, row.length).setValues([row]));
  sheet.getRange(1, 2).setNote("What this procedure checks, and the requirements it comes from.");
  sheet.getRange(4, 1).setNote("One row for each hardware system the procedure uses: pick its name in column A. " +
    "Each run then picks that system's mode.");
  tidy(sheet);
  return sheet;
}

/** A procedure tab's layout: frozen header, column widths, run borders, and colors. */
function tidy(sheet) {
  const header = headerRow(sheet);
  if (!header) return;
  const lastColumn = sheet.getLastColumn();
  const lastRow = Math.max(sheet.getLastRow(), header + 1);
  // A merge may not cross the frozen columns' edge, so undo any above the header first.
  if (header > 1) sheet.getRange(1, 1, header - 1, lastColumn).breakApart();
  sheet.setFrozenRows(header);
  sheet.setFrozenColumns(FROZEN);
  WIDTHS.forEach((width, i) => sheet.setColumnWidth(i + 1, width));
  const titles = sheet.getRange(header, 1, 1, lastColumn).getDisplayValues()[0].map((v) => v.trim().toLowerCase());
  const results = [];
  titles.forEach((title, i) => {
    if (title === "result") {
      results.push(i + 1);
      sheet.setColumnWidth(i + 1, RESULT_WIDTH);
    } else if (title === "note") {
      sheet.setColumnWidth(i + 1, NOTE_WIDTH);
    }
    if (WRAPPED.includes(title)) sheet.getRange(header + 1, i + 1, lastRow - header, 1).setWrap(true);
  });
  sheet.getRange(1, 1, lastRow, lastColumn).setVerticalAlignment("top");
  sheet.getRange(header, 1, 1, lastColumn).setFontWeight("bold").setBackground(COLORS.header);
  for (let row = 1; row < header; row++) {
    if (sheet.getRange(row, 1).getDisplayValue().trim().toLowerCase() === "purpose") {
      // Across the frozen columns, so the purpose stays in view beside the runs.
      const purpose = sheet.getRange(row, 2, 1, FROZEN - 1);
      if (!purpose.isPartOfMerge()) purpose.merge();
      purpose.setWrap(true);
      sheet.getRange(row, 1).setFontWeight("bold");
    }
  }
  for (const column of results) {
    sheet.getRange(header, column, lastRow - header + 1, 1)
      .setBorder(null, true, null, null, null, null, "#9e9e9e", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }
  const marks = results.map((c) => sheet.getRange(header + 1, c, lastRow - header, 1));
  sheet.setConditionalFormatRules(marks.length ? [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Pass").setBackground("#d9ead3")
      .setFontColor("#1b5e20").setRanges(marks).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Fail").setBackground("#f4cccc")
      .setFontColor("#9c1c1c").setRanges(marks).build(),
  ] : []);
  tidyRows(sheet, header, header + 1, lastRow - header);
}

/** Each system and its mode choices, such as "One computer (Sim)", from the Test modes tab. */
function testModes(book) {
  const sheet = book.getSheetByName("Test modes");
  const choices = {};
  if (!sheet || sheet.getLastRow() < 2) return choices;
  for (const [system, , , choice] of sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues()) {
    if (system && choice) (choices[system] = choices[system] || []).push(choice);
  }
  return choices;
}

/** Each row's dropdowns and color, by its kind in column A, set in one call per block. */
function tidyRows(sheet, header, first, count) {
  if (count < 1) return;
  const book = sheet.getParent();
  const lastColumn = sheet.getLastColumn();
  const titles = sheet.getRange(header, 1, 1, lastColumn).getDisplayValues()[0].map((v) => v.trim().toLowerCase());
  const column = (name) => titles.indexOf(name) + 1;
  const results = new Set(titles.map((t, i) => (t === "result" ? i + 1 : 0)).filter(Boolean));
  const list = (values) => SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(true).build();
  const from = (tab, a1) => {
    const reference = book.getSheetByName(tab);
    return reference ? SpreadsheetApp.newDataValidation()
      .requireValueInRange(reference.getRange(a1), true).setAllowInvalid(true).build() : null;
  };
  const modes = testModes(book);
  const systems = Object.keys(modes);
  const modeRules = {};
  for (const system of systems) modeRules[system] = list(modes[system]);
  const passFail = list(["Pass", "Fail"]);
  const date = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build();
  const stepLists = {[column("applies when")]: from("Test modes", "E2:E"), [column("node")]: from("Nodes", "A2:A"),
    [column("interface")]: from("Interfaces", "A2:A"), [column("budget")]: from("TPMs", "A2:A"),
    [column("measures")]: from("TPMs", "A2:A")};
  const kindRule = list([...KINDS, ...systems]);
  const values = sheet.getRange(first, 1, count, lastColumn).getDisplayValues();
  const validations = [];
  const backgrounds = [];
  for (const row of values) {
    const typed = row[0].trim().toLowerCase();
    const kind = KINDS.find((k) => k.toLowerCase() === typed) || "";
    const system = systems.find((s) => s.toLowerCase() === typed) || "";
    // A step that measures a TPM takes Pass, Fail, or the measured number, so no dropdown.
    const measures = column("measures") ? row[column("measures") - 1].trim() : "";
    const out = [];
    for (let c = 1; c <= lastColumn; c++) {
      if (c === 1) out.push(kindRule);
      else if (kind === "Step" && stepLists[c] !== undefined) out.push(stepLists[c]);
      else if (results.has(c) && kind === "Step") out.push(measures ? null : passFail);
      else if (results.has(c) && kind === "Date") out.push(date);
      else if (results.has(c) && system) out.push(modeRules[system]);
      else out.push(null);
    }
    validations.push(out);
    backgrounds.push(new Array(lastColumn).fill(system ? COLORS.system : COLORS[kind] || "#ffffff"));
  }
  const range = sheet.getRange(first, 1, count, lastColumn);
  range.setDataValidations(validations);
  range.setBackgrounds(backgrounds);
}

function writeInstructions(book) {
  const sheet = book.getSheetByName(HOW_TO) || book.insertSheet(HOW_TO, 0);
  const status = sheet.getDataRange().getDisplayValues().map(([v]) => v).find((v) => v.startsWith(STATUS));
  const lines = [
    ["How to record a run", true],
    ["1. Open the procedure's tab. Each run takes two columns: Result and Note."],
    ["2. In the first empty pair, type the date, such as 2026-12-02, and pick each hardware system's mode in the rows under Date."],
    ["3. Follow the steps in order. Skip a step whose Applies when names another mode: leave it blank."],
    ["4. Mark each step Pass or Fail as you go. For a step that measures a TPM, you can type the measured number instead, in the TPM's unit."],
    ["5. Link the log in the Log row, and write a note beside any row, in its Note column."],
    [""],
    ["How to write a procedure", true],
    ["Test procedures > New procedure copies the Template tab under the name you give. The name is the procedure's title on the website."],
    ["Write its purpose at the top. Under Date, add a row for each hardware system the procedure uses, with its name from the dropdown in column A."],
    ["Then write one Step row for each step, in the order it happens, from setting up to tearing down. Do says exactly what to do, where, and with which tool or command; Pass when says exactly what must be seen, where, and within what limit."],
    ["Applies when limits a step to runs with a system in given modes, such as Radio link: Bench. Leave it blank for every run."],
    ["Pick nodes, interfaces, TPMs, and modes from the dropdowns. They come from the design registries and Hardware test modes, in the Nodes, Interfaces, TPMs, and Test modes tabs, which the website keeps current."],
    ["To add a row, insert it where it happens, and set its kind in column A."],
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
