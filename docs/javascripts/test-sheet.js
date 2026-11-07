// Shows the end-to-end test procedures, and their runs, live from the test sheet: a Google
// Sheet, one tab per procedure, where testers write procedures and record runs.
//
// Each page that shows the sheet holds what this script needs (scripts/docs_hooks.py): the
// sheet's addresses, the IDs the design registries define, and the sheet as the website's
// build read it. The script draws that copy at once, then reads the published sheet and
// draws it again, so the page shows the sheet as it is now. When it cannot read the
// sheet, the build's copy stays, and the page says so.
//
// The build reads the sheet with the same rules, in scripts/design (read_sheet). Change the
// two readers together: scripts/test-sheet-readers.js checks that they read a sample sheet
// the same way. In Node, this file exports the reader for that check.
(function () {
  "use strict";

  const LAYERS = ["Sim", "Bench", "Robot"];
  const SHEET_COLUMNS = new Map([["row", "kind"], ["actor", "actor"], ["node", "node"],
    ["interface", "interface"], ["tpm", "tpm"], ["what happens", "does"]]);
  const TEMPLATE_TAB = "Template";
  const MARKS = new Map([["pass", "Pass"], ["fail", "Fail"], ["", ""]]);
  const NUMBER = /^[-+]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?$/;

  // ------------------------------------------------------------------------------------
  // Reading an .xlsx file: a zip of XML files
  // ------------------------------------------------------------------------------------

  function unzip(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = bytes.length - 22;
    while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0) throw new Error("the sheet did not come back as an .xlsx file");
    const files = new Map();
    let at = view.getUint32(end + 16, true);
    for (let i = view.getUint16(end + 10, true); i > 0; i--) {
      if (view.getUint32(at, true) !== 0x02014b50) throw new Error("the .xlsx file is damaged");
      const method = view.getUint16(at + 10, true);
      const size = view.getUint32(at + 20, true);
      const nameLength = view.getUint16(at + 28, true);
      const local = view.getUint32(at + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      files.set(name, {method, data: bytes.subarray(start, start + size)});
      at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    }
    return files;
  }

  async function inflate(data) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  const ENTITIES = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'"};

  function decode(text) {
    return text.replace(/&(?:#x([0-9a-fA-F]+)|#([0-9]+)|(amp|lt|gt|quot|apos));/g, (m, hex, dec, name) =>
      hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(parseInt(dec, 10)) : ENTITIES[name]);
  }

  function attributes(tag) {
    const found = {};
    for (const m of tag.matchAll(/([\w:]+)="([^"]*)"/g)) found[m[1]] = decode(m[2]);
    return found;
  }

  // A string's words: its t elements, leaving out phonetic guides (rPh).
  function words(xml) {
    let out = "";
    for (const m of xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g)) {
      out += decode(m[1] || "");
    }
    return out;
  }

  // [{name, rows}] in tab order, where rows maps a row number to a map of column numbers
  // to values. Rows and columns count from 1; a value is text, or a number.
  async function readXlsx(buffer) {
    const files = unzip(buffer);
    async function part(name) {
      const file = files.get(name);
      if (!file) throw new Error(`the .xlsx file has no ${name}`);
      const bytes = file.method === 8 ? await inflate(file.data) : file.data;
      return new TextDecoder().decode(bytes).replace(/\r\n?/g, "\n");
    }
    const shared = files.has("xl/sharedStrings.xml")
      ? ((await part("xl/sharedStrings.xml")).match(/<si\b[^>]*?(?:\/>|>[\s\S]*?<\/si>)/g) || []).map(words) : [];
    const targets = new Map();
    for (const tag of (await part("xl/_rels/workbook.xml.rels")).match(/<Relationship\b[^>]*>/g) || []) {
      const a = attributes(tag);
      targets.set(a.Id, a.Target);
    }
    const tabs = [];
    for (const tag of (await part("xl/workbook.xml")).match(/<sheet\b[^>]*>/g) || []) {
      const a = attributes(tag);
      const target = targets.get(a["r:id"]);
      const rows = new Map();
      const xml = await part(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
      for (const m of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const cell = attributes(m[1]);
        const inner = m[2] || "";
        const kind = cell.t || "n";
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
        const raw = v ? decode(v[1]) : "";
        let value;
        if (kind === "s") value = shared[Number(raw)];
        else if (kind === "inlineStr") {
          const item = /<is>([\s\S]*?)<\/is>/.exec(inner);
          value = item ? words(item[1]) : "";
        } else if (kind === "b") value = raw === "1" ? "TRUE" : "FALSE";
        else if (kind === "str" || kind === "e" || kind === "d") value = raw;
        else value = raw ? Number(raw) : "";
        if (value === "") continue;
        const ref = /^([A-Z]+)([0-9]+)$/.exec(cell.r || "");
        let column = 0;
        for (const letter of ref[1]) column = column * 26 + letter.charCodeAt(0) - 64;
        const row = Number(ref[2]);
        if (!rows.has(row)) rows.set(row, new Map());
        rows.get(row).set(column, value);
      }
      tabs.push({name: a.name, rows});
    }
    return tabs;
  }

  // ------------------------------------------------------------------------------------
  // Reading the test sheet: the same rules as read_sheet in scripts/design
  // ------------------------------------------------------------------------------------

  function cellText(value) {
    return typeof value === "string" ? value.trim() : String(value);
  }

  function columnLetters(column) {
    let out = "";
    while (column) {
      out = String.fromCharCode(65 + ((column - 1) % 26)) + out;
      column = Math.floor((column - 1) / 26);
    }
    return out;
  }

  // The anchor the website gives a heading with this text (Python-Markdown's toc).
  function anchor(text) {
    return text.normalize("NFKD").replace(/[^\x00-\x7F]/g, "").replace(/[^\w\s-]/g, "")
      .trim().toLowerCase().replace(/[-\s]+/g, "-");
  }

  function pad(n, width) {
    return String(n).padStart(width, "0");
  }

  function readDate(value) {
    if (typeof value === "number") {
      if (!(value >= 1 && value < 2958466)) return null;
      return new Date(Date.UTC(1899, 11, 30 + Math.floor(value))).toISOString().slice(0, 10);
    }
    const text = value.trim();
    let m, year, month, day;
    if ((m = /^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})$/.exec(text))) [year, month, day] = [+m[1], +m[2], +m[3]];
    else if ((m = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/.exec(text))) [month, day, year] = [+m[1], +m[2], +m[3]];
    else return null;
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (year < 1 || !days || day < 1 || day > days) return null;
    return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
  }

  function readNumber(value) {
    if (typeof value === "number") return value;
    const text = value.trim().replace(/,/g, "");
    return NUMBER.test(text) ? Number(text) : null;
  }

  // The test sheet's procedures and their problems: {procedures, problems}. ids holds the
  // IDs the registries define, under nodes, interfaces, and tpms.
  function readSheet(tabs, ids) {
    const known = {nodes: new Set(ids.nodes), interfaces: new Set(ids.interfaces), tpms: new Set(ids.tpms)};
    const procedures = [];
    for (const {name, rows} of tabs) {
      const title = name.replace(/\s+/g, " ").trim();
      if (title === TEMPLATE_TAB) continue;
      const proc = readProcedure(title, rows, known);
      if (proc) procedures.push(proc);
    }
    const problems = [];
    const seen = new Map();
    for (const proc of procedures) {
      if (seen.has(proc.slug)) {
        problems.push({text: `The tabs "${seen.get(proc.slug)}" and "${proc.title}" would have the same ` +
          "link on the website: rename one.", reference: false});
      } else seen.set(proc.slug, proc.title);
    }
    return {procedures, problems};
  }

  function readProcedure(title, rows, ids) {
    const text = (r, c) => (r && c ? cellText(rows.get(r)?.get(c) ?? "") : "");
    const numbers = [...rows.keys()].sort((a, b) => a - b);
    const header = numbers.find((r) => text(r, 1).toLowerCase() === "row" &&
      [...rows.get(r).values()].some((v) => cellText(v).toLowerCase() === "what happens"));
    if (header === undefined) return null;
    const headerCells = [...rows.get(header).entries()].sort((a, b) => a[0] - b[0]);
    const columns = {};
    for (const [c, v] of headerCells) {
      const key = SHEET_COLUMNS.get(cellText(v).toLowerCase());
      if (key && !(key in columns)) columns[key] = c;
    }
    const runs = headerCells.filter(([, v]) => cellText(v).toLowerCase() === "result")
      .map(([c]) => [c, text(header, c + 1).toLowerCase() === "note" ? c + 1 : null]);
    const proc = {title, slug: anchor(title), purpose: "", steps: [], passes: [], measures: [], runs: [], problems: []};
    const say = (message, reference = false) => proc.problems.push({text: message, reference});

    for (const r of numbers) {
      if (r < header && text(r, 1).toLowerCase() === "purpose" && !proc.purpose) {
        const found = [...rows.get(r).entries()].sort((a, b) => a[0] - b[0]).find(([c, v]) => c > 1 && cellText(v));
        proc.purpose = found ? cellText(found[1]) : "";
      }
    }
    const fixed = {};
    const entries = [];
    for (const r of numbers.filter((n) => n > header)) {
      const kind = text(r, 1);
      const fields = {};
      for (const key of ["actor", "node", "interface", "tpm", "does"]) fields[key] = text(r, columns[key]);
      const used = Object.values(fields).some(Boolean) || runs.some(([rc, nc]) => text(r, rc) || text(r, nc));
      const k = kind.toLowerCase();
      if (k === "layer" || k === "date" || k === "log") {
        if (!(k in fixed)) fixed[k] = r;
      } else if (!used) continue;
      else if (k === "step") entries.push(["step", {row: r, ...fields}]);
      else if (k === "pass") entries.push(["pass", {row: r, tpm: fields.tpm, text: fields.does}]);
      else if (k === "measure") entries.push(["measure", {row: r, tpm: fields.tpm, what: fields.does}]);
      else if (!kind) say(`Row ${r}: say what the row is in column A: Step, Pass, or Measure.`);
      else say(`Row ${r}: "${kind}" is not a kind of row: use Step, Pass, or Measure.`);
    }
    for (const name of ["Layer", "Date"]) {
      if (!(name.toLowerCase() in fixed)) say(`The tab has no ${name} row: add one under the header, with "${name}" in column A.`);
    }
    if (!proc.purpose) say(`Write the procedure's purpose beside "Purpose", above the table.`);

    const check = (r, kind, value) => {
      if (value && !ids[`${kind}s`].has(value)) {
        const tab = {node: "Nodes", interface: "Interfaces", tpm: "TPMs"}[kind];
        say(`Row ${r}: no ${kind === "tpm" ? "TPM" : kind} "${value}" in the design registries. Pick one from the ${tab} tab.`, true);
      }
    };
    const measured = entries.filter(([k, e]) => k === "measure" && e.tpm).map(([, e]) => e.tpm);
    const seen = new Set();
    for (const [kind, e] of entries) {
      const r = e.row;
      if (kind === "step") {
        if (!e.actor && !e.node) say(`Row ${r}: say who acts: pick the node, or write the actor.`);
        check(r, "node", e.node);
        check(r, "interface", e.interface);
        check(r, "tpm", e.tpm);
        if (!e.does) say(`Row ${r}: say what happens.`);
        proc.steps.push(e);
      } else if (kind === "pass") {
        if (!e.text) say(`Row ${r}: write what must be true, under What happens.`);
        check(r, "tpm", e.tpm);
        if (ids.tpms.has(e.tpm) && !measured.includes(e.tpm)) say(`Row ${r} checks ${e.tpm}, which no Measure row records.`);
        proc.passes.push(e);
      } else {
        if (!e.tpm) say(`Row ${r}: pick the TPM it measures.`);
        check(r, "tpm", e.tpm);
        if (e.tpm && seen.has(e.tpm)) say(`Row ${r}: ${e.tpm} has another Measure row above.`);
        seen.add(e.tpm);
        proc.measures.push(e);
      }
    }

    const lines = [...proc.steps, ...proc.passes];
    for (const [rc, nc] of runs) {
      const used = [fixed.layer, fixed.date, fixed.log, ...lines.map((e) => e.row), ...proc.measures.map((e) => e.row)];
      if (!used.some((r) => r && (text(r, rc) || text(r, nc)))) continue;
      const where = `Run in column ${columnLetters(rc)}`;
      const layerText = text(fixed.layer, rc);
      const layer = LAYERS.find((name) => name.toLowerCase() === layerText.toLowerCase()) || null;
      const dateValue = rows.get(fixed.date)?.get(rc) ?? "";
      const when = dateValue !== "" ? readDate(dateValue) : null;
      if (!layerText) say(`${where}: pick its layer: Sim, Bench, or Robot.`);
      else if (!layer) say(`${where}: its layer is "${layerText}", not Sim, Bench, or Robot.`);
      if (dateValue === "") say(`${where}: give its date, such as 2026-12-02.`);
      else if (!when) say(`${where}: "${cellText(dateValue)}" is not a date such as 2026-12-02.`);
      if (!layer || !when) continue;

      const mark = (e) => {
        const got = text(e.row, rc);
        if (!MARKS.has(got.toLowerCase())) say(`${where}, row ${e.row}: mark Pass or Fail, not "${got}".`);
        return {mark: MARKS.get(got.toLowerCase()) ?? "", note: text(e.row, nc)};
      };
      const value = (e) => {
        const raw = rows.get(e.row)?.get(rc) ?? "";
        const got = raw !== "" ? readNumber(raw) : null;
        if (raw !== "" && got === null) say(`${where}, row ${e.row}: ${e.tpm || "the value"} must be a number, not "${cellText(raw)}".`);
        return {value: got, note: text(e.row, nc)};
      };
      const run = {column: columnLetters(rc), layer, date: when, steps: proc.steps.map(mark),
        passes: proc.passes.map(mark), values: proc.measures.map(value), log: text(fixed.log, rc),
        notes: {layer: text(fixed.layer, nc), date: text(fixed.date, nc), log: text(fixed.log, nc)}};
      const marks = [...run.steps, ...run.passes];
      const markable = lines.map((e, i) => [e, marks[i].mark])
        .filter(([e]) => !(e.does || e.text || "").startsWith("[TBD")).map(([, m]) => m);
      run.marked = markable.filter(Boolean).length;
      run.markable = markable.length;
      run.result = markable.includes("Fail") ? "Fail"
        : markable.length && markable.every((m) => m === "Pass") ? "Pass" : "Incomplete";
      proc.runs.push(run);
    }
    return proc;
  }

  const reader = {readXlsx, readSheet, anchor};
  if (typeof module !== "undefined" && module.exports) module.exports = reader;
  if (typeof document === "undefined") return;

  // ------------------------------------------------------------------------------------
  // Drawing the sheet on the page
  // ------------------------------------------------------------------------------------

  const MEANING = {TBD: "To be determined: not decided yet", TBR: "To be resolved: written down, not confirmed"};
  let data, links;

  function esc(text) {
    return String(text).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  }

  // Text as HTML: escaped, with `code` in code font, and [TBD] and [TBR] marked as on every
  // other page (scripts/docs_hooks.py).
  function inline(text) {
    return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[(TBD|TBR)(?::\s*([^\]]+?))?\]/g,
      (m, kind, body) => `<span class="unsettled unsettled--${kind.toLowerCase()}" title="${MEANING[kind]}">` +
        `<span class="unsettled__tag">${kind}</span>${body ? ` ${body}` : ""}</span>`);
  }

  function table(header, rows) {
    const head = header.map((h) => `<th>${h}</th>`).join("");
    const body = rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
    return `<div class="md-typeset__scrollwrap"><div class="md-typeset__table"><table><thead><tr>${head}</tr></thead>` +
      `<tbody>${body}</tbody></table></div></div>`;
  }

  function number(n) {
    return n.toLocaleString("en-US", {maximumFractionDigits: 2});
  }

  const own = (map, key) => Object.prototype.hasOwnProperty.call(map, key);
  const unknown = (id) => `<span class="test-sheet-unknown" title="No design registry defines this">${esc(id)}</span>`;

  function nodeName(id) {
    return own(data.registry.nodes, id) ? inline(data.registry.nodes[id]) : unknown(id);
  }

  function interfaceName(id) {
    if (!own(data.registry.interfaces, id)) return unknown(id);
    const name = data.registry.interfaces[id];
    return name.includes("[") ? inline(name) : `<code>${esc(name)}</code>`;
  }

  function tpmLink(id) {
    if (!own(data.registry.tpms, id)) return unknown(id);
    return `<a href="${esc(links.budgets)}#${data.registry.tpms[id].anchor}">${esc(id)}</a>`;
  }

  function procedureLink(proc, text) {
    return `<a href="${esc(links.procedures)}#${proc.slug}">${esc(text)}</a>`;
  }

  function tabUrl(proc) {
    const gid = own(data.sheet.tabs, proc.title) ? data.sheet.tabs[proc.title] : null;
    return gid ? `${data.sheet.edit}#gid=${gid}` : data.sheet.edit;
  }

  function mark(m) {
    const word = m.mark || "Not marked";
    const note = m.note ? `: ${inline(m.note)}` : "";
    return `<span class="test-sheet-mark test-sheet-mark--${(m.mark || "none").toLowerCase()}">${word}</span>${note}`;
  }

  function result(run) {
    const counts = run.result === "Incomplete" ? ` (${run.marked} of ${run.markable} marked)` : "";
    return `<span class="test-sheet-mark test-sheet-mark--${run.result.toLowerCase()}">${run.result}</span>${counts}`;
  }

  function who(step) {
    if (step.node && step.actor) return `${inline(step.actor)}, through the ${nodeName(step.node)}`;
    return step.node ? nodeName(step.node) : inline(step.actor);
  }

  function unit(id) {
    return own(data.registry.tpms, id) ? ` ${esc(data.registry.tpms[id].unit)}` : "";
  }

  function logCell(log) {
    if (!log) return "None";
    return /^https?:\/\/\S+$/.test(log) ? `<a href="${esc(log)}">Log</a>` : inline(log);
  }

  function problemList(problems, title) {
    return `<div class="admonition warning"><p class="admonition-title">${title}</p><ul>` +
      problems.map((p) => `<li>${inline(p.text)}</li>`).join("") + "</ul></div>";
  }

  function procedureView(proc) {
    const out = [];
    if (proc.purpose) out.push(`<p>${inline(proc.purpose)}</p>`);
    if (proc.measures.length) {
      out.push(`<p><strong>Measures:</strong> ${proc.measures.map((m) => m.tpm ? tpmLink(m.tpm) : "").filter(Boolean).join(", ")}.</p>`);
    }
    out.push(`<p class="test-sheet-tab">Written in <a href="${esc(tabUrl(proc))}">its tab in the test sheet</a>.</p>`);
    if (proc.problems.length) {
      out.push(problemList(proc.problems, proc.problems.length === 1 ? "The tab needs a fix" : `The tab needs ${proc.problems.length} fixes`));
    }
    if (proc.steps.length) {
      out.push(table(["Step", "Who", "What happens", "Interface", "Budget"], proc.steps.map((s, i) => [
        String(i + 1), who(s), inline(s.does), s.interface ? interfaceName(s.interface) : "", s.tpm ? tpmLink(s.tpm) : ""])));
    }
    if (proc.passes.length) {
      out.push("<p><strong>It passes when:</strong></p><ul>" + proc.passes.map((p) =>
        `<li>${inline(p.text)}${p.tpm ? ` (${tpmLink(p.tpm)})` : ""}</li>`).join("") + "</ul>");
    }
    const runs = [...proc.runs].sort((a, b) => a.date.localeCompare(b.date) || LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));
    if (!runs.length) {
      out.push("<p><strong>Runs:</strong> none yet.</p>");
      return out.join("\n");
    }
    out.push("<p><strong>Runs:</strong></p>", table(["Date", "Layer", "Result", "Measured", "Log", "Notes"], runs.map((r) => {
      const values = proc.measures.map((m, i) => [m, r.values[i].value]).filter(([, v]) => v !== null)
        .map(([m, v]) => `${tpmLink(m.tpm)} ${number(v)}${unit(m.tpm)}`);
      const notes = [r.notes.layer, r.notes.date, r.notes.log].filter(Boolean).map(inline).join("; ");
      return [r.date, r.layer, result(r), values.join(", ") || "None", logCell(r.log), notes];
    })));
    const value = (v) => (v.value === null ? "None" : number(v.value)) + (v.note ? `: ${inline(v.note)}` : "");
    const rows = [
      ...proc.steps.map((s, i) => [`Step ${i + 1}`, ...runs.map((r) => mark(r.steps[i]))]),
      ...proc.passes.map((p, i) => [inline(p.text), ...runs.map((r) => mark(r.passes[i]))]),
      ...proc.measures.map((m, i) => [`${m.tpm ? tpmLink(m.tpm) : "Measure"}${unit(m.tpm) ? ` (${unit(m.tpm).trim()})` : ""}`,
        ...runs.map((r) => value(r.values[i]))]),
    ];
    out.push("<p>Each step, pass line, and value, run by run:</p>", table(["Line", ...runs.map((r) => `${r.date}, ${r.layer}`)], rows));
    return out.join("\n");
  }

  function latest(runs) {
    const found = {};
    for (const run of runs) if (!found[run.layer] || run.date >= found[run.layer].date) found[run.layer] = run;
    return found;
  }

  function summaryView(sheet) {
    if (!sheet.procedures.length) return "<p>The test sheet has no procedures yet.</p>";
    return table(["Procedure", ...LAYERS], sheet.procedures.map((p) => {
      const last = latest(p.runs);
      return [procedureLink(p, p.title), ...LAYERS.map((l) => (last[l] ? `${result(last[l])}, ${last[l].date}` : "Not run"))];
    }));
  }

  function judge(tpm, value) {
    const {better, goal_value: goal, threshold_value: threshold} = tpm;
    if (better !== "lower" && better !== "higher") return "not judged: the TPM has no numbers to compare with";
    const fits = (limit) => (better === "lower" ? value <= limit : value >= limit);
    if (goal !== null && goal !== undefined && fits(goal)) return "meets the goal";
    if (threshold !== null && threshold !== undefined && fits(threshold)) return "meets the threshold, not the goal";
    return threshold !== null && threshold !== undefined ? "misses the threshold" : "misses the goal";
  }

  function measurementsView(sheet) {
    const found = {};
    for (const proc of sheet.procedures) {
      for (const run of proc.runs) {
        proc.measures.forEach((m, i) => {
          const value = run.values[i].value;
          if (!m.tpm || value === null) return;
          const layers = (found[m.tpm] = found[m.tpm] || {});
          if (!layers[run.layer] || run.date >= layers[run.layer].date) layers[run.layer] = {date: run.date, value, proc};
        });
      }
    }
    const rows = Object.entries(data.registry.tpms).filter(([, t]) => !t.none).map(([id, t]) => [id, ...LAYERS.map((l) => {
      const got = (found[id] || {})[l];
      return got ? `${number(got.value)} ${esc(t.unit)}, ${procedureLink(got.proc, got.date)}: ${judge(t, got.value)}` : "Not measured";
    })]);
    return table(["TPM", ...LAYERS], rows);
  }

  function measuredByView(sheet, id) {
    const found = sheet.procedures.filter((p) => p.measures.some((m) => m.tpm === id));
    return found.map((p) => procedureLink(p, p.title)).join(", ") || "None yet";
  }

  // The same cells as sheet_markers in scripts/design.
  function markers(proc) {
    const cells = [["Purpose", proc.purpose]];
    for (const s of proc.steps) cells.push([s.row, s.actor], [s.row, s.does]);
    for (const p of proc.passes) cells.push([p.row, p.text]);
    for (const m of proc.measures) cells.push([m.row, m.what]);
    return cells.filter(([, text]) => /\[(?:TBD|TBR)\b/.test(text));
  }

  function openItemsView(sheet) {
    const rows = sheet.procedures.flatMap((p) => markers(p).map(([row, text]) => [procedureLink(p, p.title), String(row), inline(text)]));
    return rows.length ? table(["Procedure", "Row", "Marked"], rows) : "<p>None.</p>";
  }

  function when(iso) {
    return new Date(iso).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"});
  }

  function statusLine(state) {
    const sheetLink = `<a href="${esc(data.sheet.edit)}">test sheet</a>`;
    let text;
    if (state.kind === "unpublished") text = `The ${sheetLink} is not published yet, so there is nothing to show.`;
    else if (state.kind === "live") {
      text = `Read from the ${sheetLink} at ${state.at.toLocaleTimeString(undefined, {timeStyle: "short"})}. ` +
        "Google takes up to about 5 minutes to publish an edit.";
    }
    else if (!data.snapshot) {
      text = state.kind === "reading" ? `Reading the ${sheetLink}...` : `Could not read the ${sheetLink}: ${esc(state.error)}.`;
    } else {
      const built = `From the ${sheetLink} as of the website's last build, ${when(data.built)}.`;
      text = state.kind === "reading" ? `${built} Reading the sheet now...` : `${built} Could not read the sheet just now: ${esc(state.error)}.`;
    }
    return `<p class="test-sheet-status">${text}</p>`;
  }

  function render(sheet, state) {
    const known = new Set([...document.querySelectorAll('.test-sheet[data-view="procedure"]')].map((el) => el.dataset.slug));
    const problems = sheet && sheet.problems.length ? problemList(sheet.problems, "The test sheet needs a fix") : "";
    for (const el of document.querySelectorAll(".test-sheet[data-view]")) {
      const view = el.dataset.view;
      if (view === "summary") el.innerHTML = statusLine(state) + problems + (sheet ? summaryView(sheet) : "");
      else if (view === "measurements") el.innerHTML = statusLine(state) + (sheet ? measurementsView(sheet) : "");
      else if (view === "open-items") el.innerHTML = statusLine(state) + (sheet ? openItemsView(sheet) : "");
      else if (!sheet) continue;
      else if (view === "measured-by") el.innerHTML = measuredByView(sheet, el.dataset.tpm);
      else if (view === "procedure") {
        const proc = sheet.procedures.find((p) => p.slug === el.dataset.slug);
        el.innerHTML = proc ? procedureView(proc) : "<p>Removed from the test sheet since the website last built.</p>";
        el.classList.toggle("test-sheet--removed", !proc);
      } else if (view === "new-procedures") {
        el.innerHTML = sheet.procedures.filter((p) => !known.has(p.slug)).map((p) =>
          `<h2 id="${p.slug}">${esc(p.title)}<a class="headerlink" href="#${p.slug}" title="Permanent link">¶</a></h2>` +
          procedureView(p)).join("\n");
      }
    }
  }

  async function start() {
    const holder = document.getElementById("test-sheet-data");
    if (!holder || holder.dataset.started) return;
    holder.dataset.started = "1";
    data = JSON.parse(holder.textContent);
    links = data.links;
    const target = decodeURIComponent(location.hash.slice(1));
    const waiting = target && !document.getElementById(target);
    const draw = (sheet, state) => {
      try {
        render(sheet, state);
      } catch (error) {
        console.error("test-sheet.js could not draw the test sheet:", error);
      }
    };
    if (!data.sheet.published) {
      draw(data.snapshot, {kind: "unpublished"});
      return;
    }
    draw(data.snapshot, {kind: "reading"});
    try {
      const response = await fetch(`${data.sheet.published}?output=xlsx`, {cache: "no-store", signal: AbortSignal.timeout(20000)});
      if (!response.ok) throw new Error(`Google answered ${response.status}`);
      const ids = {nodes: Object.keys(data.registry.nodes), interfaces: Object.keys(data.registry.interfaces),
        tpms: Object.keys(data.registry.tpms)};
      draw(readSheet(await readXlsx(await response.arrayBuffer()), ids), {kind: "live", at: new Date()});
    } catch (error) {
      draw(data.snapshot, {kind: "failed", error: error.message || String(error)});
    }
    // A link to a procedure added since the last build finds its heading only now.
    if (waiting) document.getElementById(target)?.scrollIntoView();
  }

  // Material loads pages without a full reload (instant navigation), so run on each page.
  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
