# Design docs

Each subsystem of the robot has a design doc: what it does, its ROS nodes and interfaces,
its parameters and hardware, how it fails safely, and how it is tested. Design docs are
the source of truth: code follows them, and they are reviewed through pull requests like
code. The software sections of the team's Lunabotics design reports are drawn from them.

## The docs

| Doc | Subsystem | Status |
| --- | --- | --- |
| [`system.md`](system.md) | Architecture and integration: how every subsystem fits together | Draft |
| [`operating-modes.md`](operating-modes.md) | Operating modes and power states: what is on and what may move in each mode, for the whole robot | Draft |
| `platform.md` | Platform and dev environment | Not started |
| `drivetrain.md` | Drivetrain | Not started |
| `mechanism.md` | Mechanism control | Not started |
| `teleoperation.md` | Teleoperation and operator station | Not started |
| `sensors.md` | Sensors and robot model | Not started |
| [`autonomy.md`](autonomy.md) | Autonomy | Draft |

When you add a doc, link it in this table and keep its status current.

Two more pages apply to every subsystem: [Testing layers](testing-layers.md) defines how
each component is tested, from stand-ins on a laptop up to the rover, and
[Hardware test modes](hardware-test-modes.md) draws every hardware system in each test
mode.

Four pages are generated from the docs' [registries](#registries):

- [Interfaces](interfaces.md) lists every node and every topic, service, and action.
- [Performance budgets](performance-budgets.md) lists the technical performance measures,
  how each is split across the software, and what the tests have measured.
- [End-to-end test procedures](end-to-end-tests.md) follow one thing the robot does
  through every node it crosses, with the interface and budget each step relies on. The
  design review walks them on paper, and then they run at Sim, Bench, and Robot. They
  live in the test sheet, a Google Sheet that testers edit, and the page reads it live.
- [Open items](open-items.md) lists everything not settled yet, from open questions to
  each `[TBD]` and `[TBR]` in the docs.

## Start a design doc

1. Copy [the template](template.md) to `docs/design/<subsystem>.md`, using the file name
   from the table above.
2. Fill in the header: the owner's GitHub username, status `Draft`, and today's date. On
   the website, a table under the header lists the owner and everyone who commits to the
   doc or reviews or comments on a pull request that changes it, with their names and
   roles, generated from the git and GitHub history.
3. Put your nodes, interfaces, and open questions in the doc's
   [registry](#registries), `docs/design/<subsystem>.toml`, and run
   `scripts/design render`. If the registry already exists, it holds what the other docs
   assume your subsystem provides: confirm or change each entry.
4. Fill in every section. Write "None" rather than deleting a section, so readers know it
   was considered.
5. Delete every quote block in the template that starts with **Delete this**.
6. Add the doc to the `Subsystems` group of the `Design` section in the `nav` list in
   `mkdocs.yml`, in the same order as the table above, so it appears on the website.
7. Open a pull request. Design docs get the same review as code, plus the software lead's.

## Status

Design docs are written and reviewed before the code, so a doc moves through these
statuses, shown in its header:

| Status | Meaning |
| --- | --- |
| `Draft` | Being written. The interfaces may still change. |
| `Approved` | Written and reviewed, but no code exists yet. Code can start. |
| `In progress` | Code is being written to match the doc, but does not fully match yet. |
| `Current` | The code matches the doc. |
| `Superseded` | Replaced by another doc, which it links to. |

Change the status in the same pull request that makes it true: the review that approves
the doc, the first code pull request, and the one that finishes the code.

Update the "Last reviewed" date whenever you check the doc against the code.

## Interfaces are contracts

Each doc's interface table lists the subsystem's topics, services, and actions, with their
message types, rates, publishers, subscribers, and QoS. Other subsystems build against
that table, so:

- **The first code in every workstream is a skeleton node** that matches the interface
  table exactly, publishing fake data. Real code then replaces the fake data.
- **A pull request that changes an interface updates the doc's registry in the same pull
  request.** Reviewers reject pull requests where the code and the doc disagree.

## Registries

Nodes, interfaces, and open questions appear in more than one place: a topic is in its
publisher's doc, in each subscriber's doc, and in the system design's node graph. Typed
by hand in each place, the copies drift apart. So each one is written once, in the
registry of the doc that owns it, and `scripts/design` writes every table that shows it.

- **Each design doc has a registry beside it,** `docs/design/<doc>.toml`. The docs that
  are not written yet have one too, holding what the other docs assume of them: their
  owners confirm or change each entry in their first pull request.
- **A generated table sits between two markers** in the doc, such as
  `<!-- design: interfaces -->` and `<!-- /design -->`. Edit the registry, never the
  table: `scripts/design render` rewrites everything between the markers.
- **`scripts/design check` runs on every pull request** and fails when a generated table
  is out of date, or when the registries do not fit together.

### What a registry looks like

A node's registry entry, with the topic it publishes and the service it serves under it,
and an open question:

```toml
[[node]]
id = "mode_manager"
name = "`mode_manager`"
element = "SW.1.1"
runs_on = "Robot computer"
does = "Owns the robot state and task mode"
subscribes = ["/operator/heartbeat", "/power/battery"]
publishes_shared = ["/diagnostics"]

[[node.publishes]]
name = "/robot/mode"
type = "luna_interfaces/msg/RobotMode"
rate = "10 Hz and on change"
qos = "reliable, transient local, depth 1"

[[node.serves]]
name = "/robot/request_mode"
type = "luna_interfaces/srv/RequestMode"
rate = "On demand"
qos = "default"

[[question]]
number = 1
status = "open"
turgor = ["5.7"]
text = "Which access point and robot radio?"
```

- **A node's own fields come first,** before its `[[node.publishes]]`, `[[node.serves]]`,
  and `[[node.serves_actions]]` entries. In TOML, every line after `[[node.publishes]]`
  belongs to that entry, until the next line that starts with `[[`.
- **Every registry in `docs/design` is a full example,** such as
  `docs/design/operating-modes.toml`.

### Fields

<!-- design: fields (generated from scripts/design by scripts/design render: edit the script, not this table) -->

| Entry | Where it goes | What it is |
| --- | --- | --- |
| `[[element]]` | `system.toml` | A software element from the PDR's system hierarchy |
| `[[node]]` | Each doc's registry | A node the doc designs |
| `[[node.publishes]]` | Under its `[[node]]` | A topic the node publishes. No other node publishes it. |
| `[[node.serves]]` | Under its `[[node]]` | A service the node serves. No other node serves it. |
| `[[node.serves_actions]]` | Under its `[[node]]` | An action the node serves. No other node serves it. |
| `[[shared]]` | `system.toml` | A topic many nodes publish by design, such as `/diagnostics` |
| `[[question]]` | Each doc's registry | A question in the doc's section 9, open or decided |
| `[[tpm]]` | `performance-budgets.toml` | A technical performance measure and its budget |
| `[[tpm.row]]` | Under its `[[tpm]]` | One part of the TPM's budget |
| `[[sheet]]` | `end-to-end-tests.toml` | The test sheet: the Google Sheet that holds the end-to-end test procedures and their runs, one tab per procedure |

| Entry | Field | Required | What it holds |
| --- | --- | --- | --- |
| `[[element]]` | `id` | Yes | Its ID in the hierarchy, such as `SW.1.2` |
| `[[element]]` | `name` | Yes | Its name |
| `[[element]]` | `function` | Yes | What it does, in one sentence |
| `[[element]]` | `doc` | Yes | The design doc that designs it, such as `drivetrain.md` |
| `[[element]]` | `parent` | No | The ID of the element above it |
| `[[element]]` | `connects_to` | No | What it connects to outside software |
| `[[element]]` | `turgor` | No | The Turgor deliverables that write its design doc, such as `["3.1"]` |
| `[[node]]` | `id` | Yes | The key other entries use for it: its ROS name, once it has one |
| `[[node]]` | `name` | Yes | What tables show: the ROS name in code font, or plain words while it has none |
| `[[node]]` | `element` | Yes | The ID of its element |
| `[[node]]` | `runs_on` | Yes | The computer it runs on |
| `[[node]]` | `does` | Yes | What it does |
| `[[node]]` | `package` | No | Its ROS package |
| `[[node]]` | `subscribes` | No | IDs of the topics it subscribes to |
| `[[node]]` | `calls` | No | IDs of the services it calls and the actions it sends goals to |
| `[[node]]` | `publishes_shared` | No | IDs of the shared topics it publishes, such as `/diagnostics` |
| `[[node.publishes]]` | `name` | Yes | Its name, or a marker while it has none |
| `[[node.publishes]]` | `type` | Yes | Its message, service, or action type |
| `[[node.publishes]]` | `rate` | Yes | How often it is published, or `On demand` |
| `[[node.publishes]]` | `qos` | Yes | Its QoS |
| `[[node.publishes]]` | `id` | No | The key other nodes use for it when its name is a marker; otherwise its name |
| `[[node.publishes]]` | `note` | No | A sentence shown under the table on the Interfaces page |
| `[[node.serves]]` | `name` | Yes | Its name, or a marker while it has none |
| `[[node.serves]]` | `type` | Yes | Its message, service, or action type |
| `[[node.serves]]` | `rate` | Yes | How often it is published, or `On demand` |
| `[[node.serves]]` | `qos` | Yes | Its QoS |
| `[[node.serves]]` | `id` | No | The key other nodes use for it when its name is a marker; otherwise its name |
| `[[node.serves]]` | `note` | No | A sentence shown under the table on the Interfaces page |
| `[[node.serves_actions]]` | `name` | Yes | Its name, or a marker while it has none |
| `[[node.serves_actions]]` | `type` | Yes | Its message, service, or action type |
| `[[node.serves_actions]]` | `rate` | Yes | How often it is published, or `On demand` |
| `[[node.serves_actions]]` | `qos` | Yes | Its QoS |
| `[[node.serves_actions]]` | `id` | No | The key other nodes use for it when its name is a marker; otherwise its name |
| `[[node.serves_actions]]` | `note` | No | A sentence shown under the table on the Interfaces page |
| `[[shared]]` | `name` | Yes | Its name, or a marker while it has none |
| `[[shared]]` | `type` | Yes | Its message, service, or action type |
| `[[shared]]` | `rate` | Yes | How often it is published, or `On demand` |
| `[[shared]]` | `qos` | Yes | Its QoS |
| `[[shared]]` | `id` | No | The key other nodes use for it when its name is a marker; otherwise its name |
| `[[shared]]` | `note` | No | A sentence shown under the table on the Interfaces page |
| `[[question]]` | `number` | Yes | Its number in the doc, which never changes |
| `[[question]]` | `text` | Yes | The question, or once decided, the decision |
| `[[question]]` | `status` | Yes | `open` or `decided` |
| `[[question]]` | `decided` | No | The date it was decided, such as 2026-10-27; required once decided |
| `[[question]]` | `turgor` | No | The Turgor deliverables that answer it, such as `["5.7"]` |
| `[[tpm]]` | `id` | Yes | Its ID, such as `TPM-2` |
| `[[tpm]]` | `measure` | Yes | The one quantity it measures |
| `[[tpm]]` | `unit` | Yes | Its one unit |
| `[[tpm]]` | `source` | Yes | The PMP TPM and guidebook rule it tracks, or Derived and what it protects |
| `[[tpm]]` | `threshold` | Yes | The least acceptable value |
| `[[tpm]]` | `goal` | Yes | The target value |
| `[[tpm]]` | `budget` | No | The title of its budget table |
| `[[tpm]]` | `part` | No | The heading of the budget table's first column |
| `[[tpm]]` | `elements_header` | No | The heading of its elements column |
| `[[tpm]]` | `allocation` | No | The heading of its allocation column |
| `[[tpm]]` | `budget_unit` | No | The unit of each row's allocation, shown in each doc's Budgets table |
| `[[tpm]]` | `cases` | No | Column names when the budget differs by case, such as TELEOP and AUTO |
| `[[tpm]]` | `limit` | No | The most the counted parts may add up to; the check enforces it |
| `[[tpm]]` | `notes` | No | Sentences shown under the budget table |
| `[[tpm]]` | `total_label` | No | The total row's label, when it is not Total |
| `[[tpm]]` | `total_role` | No | The element that owns the total |
| `[[tpm]]` | `none` | No | Why it has no budget, shown instead of one |
| `[[tpm]]` | `better` | No | `lower` or `higher`: which way is better, so a measurement can be judged |
| `[[tpm]]` | `threshold_value` | No | The threshold as a number in its unit, to judge measurements against |
| `[[tpm]]` | `goal_value` | No | The goal as a number in its unit, to judge measurements against |
| `[[tpm.row]]` | `part` | Yes | This part of the budget |
| `[[tpm.row]]` | `elements` | No | IDs of the elements it falls to; each doc's Budgets table shows the rows that name its elements |
| `[[tpm.row]]` | `role` | No | What each element does for this part, shown instead of the IDs |
| `[[tpm.row]]` | `value` | No | The allocation as shown, such as `≤150`; required unless the TPM has cases |
| `[[tpm.row]]` | `amount` | No | The number the total counts; leave it out for a part the total does not count |
| `[[tpm.row]]` | `amounts` | No | One number per case, for a TPM with cases |
| `[[tpm.row]]` | `basis` | No | Where the value comes from |
| `[[tpm.row]]` | `unit` | No | This row's unit, when it differs from the TPM's |
| `[[sheet]]` | `edit_url` | Yes | The sheet's address, where testers write procedures and record runs |
| `[[sheet]]` | `published` | No | Its published address (File, Share, Publish to web), ending in /pub; the website reads the sheet from it |

<!-- /design -->

Beyond each field, the check fails when:

- an element, node, or interface that a field names does not exist;
- a node subscribes to anything but a topic, or calls anything but a service or action;
- two nodes define the same interface, or no node publishes a shared topic;
- a doc has two questions with one number, or a decided question has no date;
- a TPM's counted parts add up to more than its `limit`;
- a value holds a `|` or a line break, which would break a table;
- a procedure in the test sheet names a node, interface, or TPM that no registry defines,
  or a hardware system or mode that no heading of
  [Hardware test modes](hardware-test-modes.md) defines, including in a step's Applies
  when chips. The sheet's dropdowns offer only what these define, so this happens when a
  pull request renames or removes one that a procedure uses: update the procedure in the
  same change.

### Blocks

A doc shows its registry's content in these blocks, each between its marker and
`<!-- /design -->`:

<!-- design: blocks (generated from scripts/design by scripts/design render: edit the script, not this table) -->

| Block | Options | What it shows |
| --- | --- | --- |
| `<!-- design: nodes -->` | `connected` | The nodes in this doc's registry. With `connected`, also every node that publishes or subscribes to this doc's interfaces, with its design doc. |
| `<!-- design: interfaces -->` | None | The topics, services, and actions this doc's nodes define, then the ones they use from other docs |
| `<!-- design: questions -->` | None | This doc's open and decided questions |
| `<!-- design: budgets -->` | None | Every budget row in `performance-budgets.toml` that names one of this doc's elements |
| `<!-- design: elements -->` | None | Every software element |
| `<!-- design: graph -->` | None | A diagram of every node, with an arrow for each topic and call |
| `<!-- design: fields -->` | None | This reference of registry fields |
| `<!-- design: blocks -->` | None | This list of blocks |

<!-- /design -->

### Conventions

- **Names in code font are real ROS names,** such as `` `mode_manager` ``. Plain words,
  such as "Drivetrain node", mean the name is not decided yet.
- **Who works on an item, and by when, belongs in Turgor, not here.** A question names
  its Turgor deliverable, and Turgor holds who answers it and when, so a change of hands
  never needs a pull request. A `[TBD]` or `[TBR]` names where it gets settled the same way:
  a deliverable, an open question, or another team.
- **Values may hold `[TBD]` and `[TBR]` markers,** as in any doc. [Open items](open-items.md)
  lists each one once.

## Diagrams

Draw diagrams in [Mermaid](https://mermaid.js.org/syntax/flowchart.html), in a fenced
`mermaid` code block. GitHub renders Mermaid, changes show up in diffs like code, and the
template has an example. VS Code in the dev container previews Mermaid in its Markdown
preview.
