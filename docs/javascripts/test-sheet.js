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
  const SHEET_COLUMNS = new Map([["row", "kind"], ["do", "do"], ["pass when", "pass_when"], ["applies when", "applies"],
    ["actor", "actor"], ["node", "node"], ["interface", "interface"], ["budget", "budget"], ["measures", "measures"]]);
  const STEP_FIELDS = ["applies", "actor", "node", "do", "pass_when", "interface", "budget", "measures"];
  const TEMPLATE_TAB = "Template";
  const MARKS = new Map([["pass", "Pass"], ["fail", "Fail"]]);
  // How a measured value compares with its TPM, and whether the step passes.
  const LEVELS = {goal: "Pass", threshold: "Pass", recorded: "Pass", missed: "Fail"};
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

  function modeName(text) {
    return text.trim().replace(/\s*\((?:Sim|Bench|Robot)\)$/, "");
  }

  // How a measured value compares with its TPM: "goal", "threshold" (it meets the threshold
  // but not the goal), "missed", or "recorded" when the TPM has no numbers yet.
  function judge(tpm, value) {
    const better = tpm.better;
    const goal = tpm.goal_value ?? null;
    const threshold = tpm.threshold_value ?? null;
    if ((better !== "lower" && better !== "higher") || (goal === null && threshold === null)) return "recorded";
    const fits = (limit) => (better === "lower" ? value <= limit : value >= limit);
    if (goal !== null && fits(goal)) return "goal";
    if (threshold !== null && fits(threshold)) return "threshold";
    return "missed";
  }

  // The test sheet's procedures and their problems: {procedures, problems}. ids is what a
  // procedure may name: nodes, interfaces, tpms (each with its numbers), and modes (each
  // hardware system's test modes).
  function readSheet(tabs, ids) {
    const known = {nodes: new Set(ids.nodes), interfaces: new Set(ids.interfaces), tpms: ids.tpms, modes: ids.modes};
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
    const has = (map, key) => Object.prototype.hasOwnProperty.call(map, key);
    const numbers = [...rows.keys()].sort((a, b) => a - b);
    const header = numbers.find((r) => text(r, 1).toLowerCase() === "row" &&
      [...rows.get(r).values()].some((v) => cellText(v).toLowerCase() === "do"));
    if (header === undefined) return null;
    const headerCells = [...rows.get(header).entries()].sort((a, b) => a[0] - b[0]);
    const columns = {};
    for (const [c, v] of headerCells) {
      const key = SHEET_COLUMNS.get(cellText(v).toLowerCase());
      if (key && !(key in columns)) columns[key] = c;
    }
    const runs = headerCells.filter(([, v]) => cellText(v).toLowerCase() === "result")
      .map(([c]) => [c, text(header, c + 1).toLowerCase() === "note" ? c + 1 : null]);
    const proc = {title, slug: anchor(title), purpose: "", systems: [], steps: [], runs: [], problems: []};
    const say = (message, reference = false) => proc.problems.push({text: message, reference});
    const check = (r, kind, value) => {
      const set = kind === "tpm" ? null : ids[`${kind}s`];
      if (value && (set ? !set.has(value) : !has(ids.tpms, value))) {
        const tab = {node: "Nodes", interface: "Interfaces", tpm: "TPMs"}[kind];
        say(`Row ${r}: no ${kind === "tpm" ? "TPM" : kind} "${value}" in the design registries. Pick one from the ${tab} tab.`, true);
      }
    };

    for (const r of numbers) {
      if (r < header && text(r, 1).toLowerCase() === "purpose" && !proc.purpose) {
        const found = [...rows.get(r).entries()].sort((a, b) => a[0] - b[0]).find(([c, v]) => c > 1 && cellText(v));
        proc.purpose = found ? cellText(found[1]) : "";
      }
    }
    const systems = new Map(Object.keys(ids.modes).map((s) => [s.toLowerCase(), s]));
    const fixed = {};
    for (const r of numbers.filter((n) => n > header)) {
      const kind = text(r, 1);
      const fields = {};
      for (const key of STEP_FIELDS) fields[key] = text(r, columns[key]);
      const used = Object.values(fields).some(Boolean) || runs.some(([rc, nc]) => text(r, rc) || text(r, nc));
      const k = kind.toLowerCase();
      if (k === "date" || k === "log") {
        if (!(k in fixed)) fixed[k] = r;
      } else if (systems.has(k)) {
        const system = systems.get(k);
        if (proc.systems.some((s) => s.system === system)) say(`Row ${r}: ${system} has another row above.`);
        else proc.systems.push({row: r, system});
      } else if (!used) continue;
      else if (k === "step") proc.steps.push({row: r, ...fields});
      else if (!kind) say(`Row ${r}: say what the row is in column A: Step, Date, Log, or a system from the Test modes tab.`);
      else say(`Row ${r}: "${kind}" is not a kind of row: use Step, Date, Log, or a system from the Test modes tab.`);
    }
    if (!("date" in fixed)) say('The tab has no Date row: add one under the header, with "Date" in column A.');
    if (!proc.systems.length) {
      say("List the hardware systems the procedure uses: a row for each, under Date, with its name from the " +
        "Test modes tab in column A.");
    }
    if (!proc.purpose) say(`Write the procedure's purpose beside "Purpose", above the table.`);

    const listed = new Set(proc.systems.map((s) => s.system));
    for (const step of proc.steps) {
      const r = step.row;
      const applies = step.applies;
      step.applies = null;
      if (applies) {
        const at = applies.indexOf(":");
        const system = at < 0 ? applies : applies.slice(0, at);
        const canonical = systems.get(system.trim().toLowerCase());
        const names = at < 0 ? [] : applies.slice(at + 1).split(",").filter((n) => n.trim()).map(modeName);
        if (at < 0 || !names.length) {
          say(`Row ${r}: write Applies when as "System: Mode", such as "Radio link: Bench", not "${applies}".`);
        } else if (canonical === undefined) {
          say(`Row ${r}: no system "${system.trim()}" in Hardware test modes. Pick one from the Test modes tab.`, true);
        } else {
          const known = new Map(ids.modes[canonical].map((m) => [m.mode.toLowerCase(), m.mode]));
          const modes = [];
          for (const name of names) {
            if (known.has(name.toLowerCase())) modes.push(known.get(name.toLowerCase()));
            else say(`Row ${r}: ${canonical} has no mode "${name}" in Hardware test modes. Pick one from the Test modes tab.`, true);
          }
          if (!listed.has(canonical)) {
            say(`Row ${r} applies when ${canonical} is in a given mode, but the procedure has no ${canonical} row: add one under Date.`);
          }
          step.applies = {text: applies, system: canonical, modes};
        }
      }
      const tbd = step.do.startsWith("[TBD") || step.pass_when.startsWith("[TBD");
      if (!step.do && !tbd) say(`Row ${r}: say what to do, under Do.`);
      if (!step.pass_when && !tbd) say(`Row ${r}: say what must be seen for the step to pass, under Pass when.`);
      check(r, "node", step.node);
      check(r, "interface", step.interface);
      check(r, "tpm", step.budget);
      check(r, "tpm", step.measures);
    }

    for (const [rc, nc] of runs) {
      const used = [fixed.date, fixed.log, ...proc.systems.map((s) => s.row), ...proc.steps.map((s) => s.row)];
      if (!used.some((r) => r && (text(r, rc) || text(r, nc)))) continue;
      const where = `Run in column ${columnLetters(rc)}`;
      const dateValue = rows.get(fixed.date)?.get(rc) ?? "";
      const when = dateValue !== "" ? readDate(dateValue) : null;
      if (dateValue === "") say(`${where}: give its date, such as 2026-12-02.`);
      else if (!when) say(`${where}: "${cellText(dateValue)}" is not a date such as 2026-12-02.`);
      const modes = {};
      let ready = Boolean(when);
      for (const s of proc.systems) {
        const got = text(s.row, rc);
        const mode = ids.modes[s.system].find((m) => m.mode.toLowerCase() === modeName(got).toLowerCase()) ?? null;
        if (!got) {
          say(`${where}: pick its ${s.system} mode.`);
          ready = false;
        } else if (mode === null) {
          say(`${where}: "${got}" is not a ${s.system} mode in Hardware test modes.`);
          ready = false;
        } else modes[s.system] = mode;
      }
      if (!ready || !Object.keys(modes).length) continue;

      const results = [];
      for (const step of proc.steps) {
        const r = step.row;
        const a = step.applies;
        const raw = rows.get(r)?.get(rc) ?? "";
        const got = raw !== "" ? cellText(raw) : "";
        const applies = a === null || a.modes.includes(modes[a.system]?.mode);
        const entry = {applies, mark: "", value: null, level: "", note: text(r, nc)};
        const value = got ? readNumber(raw) : null;
        if (!applies) {
          if (got) {
            const current = modes[a.system]?.mode;
            const which = current ? `${a.system}: ${current}` : `no ${a.system} mode`;
            say(`${where}, row ${r}: the step does not apply to this run (${which}), so leave it blank.`);
          }
        } else if (!got) {
          // Not marked yet.
        } else if (value !== null && step.measures) {
          const tpm = has(ids.tpms, step.measures) ? ids.tpms[step.measures] : null;
          entry.value = value;
          entry.level = tpm ? judge(tpm, value) : "recorded";
          entry.mark = LEVELS[entry.level];
        } else if (value !== null) {
          say(`${where}, row ${r}: ${got} is a number, but the step measures no TPM. Mark Pass or Fail, or pick ` +
            "the TPM it measures under Measures.");
        } else if (MARKS.has(got.toLowerCase())) {
          entry.mark = MARKS.get(got.toLowerCase());
        } else {
          const also = step.measures ? ", or type the measured number" : "";
          say(`${where}, row ${r}: mark Pass or Fail${also}, not "${got}".`);
        }
        results.push(entry);
      }
      const considered = proc.steps.map((s, i) => [s, results[i]])
        .filter(([s, e]) => e.applies && !(s.do.startsWith("[TBD") || s.pass_when.startsWith("[TBD")));
      const marks = considered.map(([, e]) => e.mark);
      const modeNotes = {};
      for (const s of proc.systems) modeNotes[s.system] = text(s.row, nc);
      const byLayer = Object.values(modes).map((m) => m.layer).sort((x, y) => LAYERS.indexOf(x) - LAYERS.indexOf(y));
      proc.runs.push({
        column: columnLetters(rc), date: when, layer: byLayer[byLayer.length - 1],
        modes: Object.fromEntries(Object.entries(modes).map(([system, m]) => [system, m.mode])),
        steps: results, log: text(fixed.log, rc),
        notes: {date: text(fixed.date, nc), log: text(fixed.log, nc)},
        mode_notes: modeNotes,
        marked: marks.filter(Boolean).length, markable: marks.length,
        result: marks.includes("Fail") ? "Fail" : marks.length && marks.every((m) => m === "Pass") ? "Pass" : "Incomplete",
        threshold_only: [...new Set(considered.filter(([, e]) => e.level === "threshold").map(([s]) => s.measures))],
      });
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

  const VERDICT = {goal: "meets the goal", threshold: "meets the threshold, not the goal", missed: "misses the threshold",
    recorded: "recorded: the TPM has no numbers to judge it by yet"};

  function modeLink(system, mode) {
    const found = own(data.registry.modes, system) ? data.registry.modes[system].find((m) => m.mode === mode) : null;
    const label = found && found.mode !== found.layer ? `${mode} (${found.layer})` : mode;
    return found ? `<a href="${esc(links.modes)}#${found.anchor}">${esc(label)}</a>` : esc(mode);
  }

  function measuredText(step, entry) {
    const tpm = own(data.registry.tpms, step.measures) ? data.registry.tpms[step.measures] : null;
    const noThreshold = tpm && (tpm.threshold_value ?? null) === null;
    const verdict = entry.level === "missed" && noThreshold ? "misses the goal" : VERDICT[entry.level];
    const css = entry.level === "missed" ? "fail" : entry.level === "threshold" ? "threshold" : "pass";
    return `<span class="test-sheet-mark test-sheet-mark--${css}">${number(entry.value)}${unit(step.measures)}</span>` +
      (verdict ? `: ${verdict}` : "");
  }

  function stepCell(step, entry) {
    let out;
    if (!entry.applies) return '<span class="test-sheet-mark test-sheet-mark--none">Not in this run</span>';
    if (entry.value !== null) out = measuredText(step, entry);
    else out = `<span class="test-sheet-mark test-sheet-mark--${(entry.mark || "none").toLowerCase()}">${entry.mark || "Not marked"}</span>`;
    return out + (entry.note ? `: ${inline(entry.note)}` : "");
  }

  function result(run) {
    const counts = run.result === "Incomplete" ? ` (${run.marked} of ${run.markable} marked)` : "";
    const level = run.result === "Pass" && run.threshold_only.length
      ? ` (${run.threshold_only.map(tpmLink).join(", ")} at threshold)` : "";
    return `<span class="test-sheet-mark test-sheet-mark--${run.result.toLowerCase()}">${run.result}</span>${level}${counts}`;
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
    if (proc.systems.length) {
      out.push(`<p><strong>Uses:</strong> ${proc.systems.map((s) => `<a href="${esc(links.modes)}#${anchor(s.system)}">${esc(s.system)}</a>`).join(", ")}.</p>`);
    }
    const measured = [...new Set(proc.steps.map((s) => s.measures).filter(Boolean))];
    if (measured.length) out.push(`<p><strong>Measures:</strong> ${measured.map(tpmLink).join(", ")}.</p>`);
    out.push(`<p class="test-sheet-tab">Written in <a href="${esc(tabUrl(proc))}">its tab in the test sheet</a>.</p>`);
    if (proc.problems.length) {
      out.push(problemList(proc.problems, proc.problems.length === 1 ? "The tab needs a fix" : `The tab needs ${proc.problems.length} fixes`));
    }
    if (proc.steps.length) {
      // A walkthrough reads top to bottom: each step's Do and Pass when in full, with what it
      // applies to, who acts, and what it names on a line above.
      out.push('<ol class="test-sheet-steps">' + proc.steps.map((s) => {
        const meta = [
          s.applies ? `For ${esc(s.applies.system)}: ${s.applies.modes.map((m) => modeLink(s.applies.system, m)).join(", ")}` : "",
          s.actor || s.node ? who(s) : "",
          s.interface ? interfaceName(s.interface) : "",
          s.budget ? `Budget ${tpmLink(s.budget)}` : "",
          s.measures ? `Measures ${tpmLink(s.measures)}` : "",
        ].filter(Boolean);
        return "<li>" + (meta.length ? `<p class="test-sheet-step-meta">${meta.join(" · ")}</p>` : "") +
          `<p><strong>Do:</strong> ${inline(s.do)}</p>` +
          (s.pass_when ? `<p><strong>Pass when:</strong> ${inline(s.pass_when)}</p>` : "") + "</li>";
      }).join("") + "</ol>");
    }
    const runs = [...proc.runs].sort((a, b) => a.date.localeCompare(b.date) || LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));
    if (!runs.length) {
      out.push("<p><strong>Runs:</strong> none yet.</p>");
      return out.join("\n");
    }
    out.push("<p><strong>Runs:</strong></p>", table(["Date", "Layer", "Modes", "Result", "Measured", "Log", "Notes"], runs.map((r) => {
      const modes = Object.entries(r.modes).map(([system, mode]) => `${esc(system)}: ${modeLink(system, mode)}`).join("<br>");
      const values = proc.steps.map((s, i) => [s, r.steps[i]]).filter(([, e]) => e.value !== null)
        .map(([s, e]) => `${tpmLink(s.measures)} ${measuredText(s, e)}`);
      const notes = [r.notes.date, r.notes.log, ...Object.entries(r.mode_notes).filter(([, n]) => n).map(([system, n]) => `${system}: ${n}`)]
        .filter(Boolean).map(inline).join("; ");
      return [r.date, r.layer, modes, result(r), values.join("<br>") || "None", logCell(r.log), notes];
    })));
    const rows = proc.steps.map((s, i) => [`Step ${i + 1}`, ...runs.map((r) => stepCell(s, r.steps[i]))]);
    out.push("<p>Each step, run by run:</p>", table(["Step", ...runs.map((r) => `${r.date}, ${r.layer}`)], rows));
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

  function measurementsView(sheet) {
    const found = {};
    for (const proc of sheet.procedures) {
      for (const run of proc.runs) {
        proc.steps.forEach((step, i) => {
          const entry = run.steps[i];
          if (!step.measures || entry.value === null) return;
          const layers = (found[step.measures] = found[step.measures] || {});
          if (!layers[run.layer] || run.date >= layers[run.layer].date) layers[run.layer] = {date: run.date, step, entry, proc};
        });
      }
    }
    const rows = Object.entries(data.registry.tpms).filter(([, t]) => !t.none).map(([id]) => [id, ...LAYERS.map((l) => {
      const got = (found[id] || {})[l];
      return got ? `${measuredText(got.step, got.entry)}, ${procedureLink(got.proc, got.date)}` : "Not measured";
    })]);
    return table(["TPM", ...LAYERS], rows);
  }

  function measuredByView(sheet, id) {
    const found = sheet.procedures.filter((p) => p.steps.some((s) => s.measures === id));
    return found.map((p) => procedureLink(p, p.title)).join(", ") || "None yet";
  }

  // The same cells as sheet_markers in scripts/design.
  function markers(proc) {
    const cells = [["Purpose", proc.purpose]];
    for (const s of proc.steps) cells.push([s.row, s.actor], [s.row, s.do], [s.row, s.pass_when]);
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
    // Drawing changes the height of what is above a linked heading, so scroll to it again after
    // each drawing, unless the reader has scrolled away since.
    const target = decodeURIComponent(location.hash.slice(1));
    let placed = null;
    const draw = (sheet, state) => {
      try {
        render(sheet, state);
      } catch (error) {
        console.error("test-sheet.js could not draw the test sheet:", error);
      }
      const heading = target && document.getElementById(target);
      if (heading && (placed === null || Math.abs(window.scrollY - placed) < 2)) {
        heading.scrollIntoView();
        placed = window.scrollY;
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
        tpms: data.registry.tpms, modes: data.registry.modes};
      draw(readSheet(await readXlsx(await response.arrayBuffer()), ids), {kind: "live", at: new Date()});
    } catch (error) {
      draw(data.snapshot, {kind: "failed", error: error.message || String(error)});
    }
  }

  // Material loads pages without a full reload (instant navigation), so run on each page.
  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
