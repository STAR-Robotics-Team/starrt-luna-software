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
];
const COLUMNS = ["Row", "Actor", "Node", "What happens", "Interface", "TPM"];
const WIDTHS = [80, 110, 170, 380, 190, 75];
// Row, Actor, Node, and What happens stay in view while the run columns scroll.
const FROZEN = 4;
const RUNS = 10;
const RESULT_WIDTH = 75;
const NOTE_WIDTH = 200;
const KINDS = ["Step", "Pass", "Measure", "Layer", "Date", "Log"];
const LAYERS = ["Sim", "Bench", "Robot"];
const COLORS = {header: "#e8eaf6", Layer: "#f3f3f3", Date: "#f3f3f3", Log: "#f3f3f3", Pass: "#eef7ee", Measure: "#edf2fb"};
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
    sheet.getRange("A1").setFormula(`=IMPORTDATA("${SITE}${path}")`);
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

/** On every edit: note when it happened, and fix the row's dropdowns if its kind changed. */
function recordEdit(e) {
  PropertiesService.getScriptProperties().setProperty("LAST_EDIT", String(Date.now()));
  const sheet = e.range.getSheet();
  const header = headerRow(sheet);
  if (header && e.range.getColumn() === 1 && e.range.getLastRow() > header) {
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
  const when = Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "MMM d, h:mm a");
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
    row.some((v) => v.trim().toLowerCase() === "what happens"));
  return i + 1;
}

function makeTemplate(book) {
  const sheet = book.insertSheet(TEMPLATE, book.getNumSheets());
  const header = [...COLUMNS];
  for (let i = 0; i < RUNS; i++) header.push("Result", "Note");
  const rows = [["Purpose"], header, ["Layer"], ["Date"], ["Step"], ["Step"], ["Step"], ["Step"], ["Step"],
    ["Pass"], ["Pass"], ["Pass"], ["Measure"], ["Log"]];
  rows.forEach((row, i) => sheet.getRange(i + 1, 1, 1, row.length).setValues([row]));
  sheet.getRange(1, 2).setNote("What this procedure checks, and the requirements it comes from.");
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
      sheet.getRange(header + 1, i + 1, lastRow - header, 1).setWrap(true);
    }
  });
  sheet.getRange(1, 1, lastRow, lastColumn).setVerticalAlignment("top");
  sheet.getRange(header + 1, 4, lastRow - header, 1).setWrap(true);
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

/** Each row's dropdowns and color, by its kind in column A, set in one call per block. */
function tidyRows(sheet, header, first, count) {
  if (count < 1) return;
  const book = sheet.getParent();
  const lastColumn = sheet.getLastColumn();
  const titles = sheet.getRange(header, 1, 1, lastColumn).getDisplayValues()[0].map((v) => v.trim().toLowerCase());
  const column = (name) => titles.indexOf(name.toLowerCase()) + 1;
  const results = new Set(titles.map((t, i) => (t === "result" ? i + 1 : 0)).filter(Boolean));
  const list = (values) => SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(true).build();
  const from = (tab) => {
    const reference = book.getSheetByName(tab);
    return reference ? SpreadsheetApp.newDataValidation()
      .requireValueInRange(reference.getRange("A2:A"), true).setAllowInvalid(true).build() : null;
  };
  const marks = {
    Layer: list(LAYERS),
    Date: SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build(),
    Step: list(["Pass", "Fail"]),
    Pass: list(["Pass", "Fail"]),
    Measure: SpreadsheetApp.newDataValidation().requireNumberBetween(-1e15, 1e15).setAllowInvalid(true).build(),
  };
  const names = {[column("Node")]: [from("Nodes"), ["Step"]], [column("Interface")]: [from("Interfaces"), ["Step"]],
    [column("TPM")]: [from("TPMs"), ["Step", "Pass", "Measure"]]};
  const kindRule = list(KINDS);
  const range = sheet.getRange(first, 1, count, lastColumn);
  const validations = [];
  const backgrounds = [];
  for (const [typed] of sheet.getRange(first, 1, count, 1).getDisplayValues()) {
    const kind = KINDS.find((k) => k.toLowerCase() === typed.trim().toLowerCase()) || "";
    const row = [];
    for (let c = 1; c <= lastColumn; c++) {
      if (c === 1) row.push(kindRule);
      else if (names[c]) row.push(names[c][1].includes(kind) ? names[c][0] : null);
      else if (results.has(c)) row.push(marks[kind] || null);
      else row.push(null);
    }
    validations.push(row);
    backgrounds.push(new Array(lastColumn).fill(COLORS[kind] || "#ffffff"));
  }
  range.setDataValidations(validations);
  range.setBackgrounds(backgrounds);
}

function writeInstructions(book) {
  const sheet = book.getSheetByName(HOW_TO) || book.insertSheet(HOW_TO, 0);
  const status = sheet.getDataRange().getDisplayValues().map(([v]) => v).find((v) => v.startsWith(STATUS));
  const lines = [
    ["How to record a run", true],
    ["1. Open the procedure's tab. Each run takes two columns: Result and Note."],
    ["2. In the first empty pair, pick the layer (Sim, Bench, or Robot) and type the date, such as 2026-12-02."],
    ["3. Mark each step and pass line Pass or Fail as you go. Leave a row blank until it is checked. Type each value measured, in its TPM's unit."],
    ["4. Link the log in the Log row. Write a note beside any row, in its Note column."],
    [""],
    ["How to write a procedure", true],
    ["Test procedures > New procedure copies the Template tab under the name you give. The name is the procedure's title on the website."],
    ["Write its purpose at the top. Then each row is a Step (who acts and what happens, in order), a Pass line (what must be true for a run to pass), or a Measure (a TPM each run records)."],
    ["Pick nodes, interfaces, and TPMs from the dropdowns. They come from the design registries, in the Nodes, Interfaces, and TPMs tabs, which the website keeps current."],
    ["To add a row, insert it among the rows of its kind, and set its kind in column A."],
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
