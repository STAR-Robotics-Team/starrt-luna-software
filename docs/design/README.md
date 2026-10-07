# Design docs

Each subsystem of the robot has a design doc: what it does, its ROS nodes and interfaces,
its parameters and hardware, how it fails safely, and how it is tested. Design docs are
the source of truth: code follows them, and they are reviewed through pull requests like
code. The software sections of the team's Lunabotics design reports are drawn from them.

## The docs

| Doc | Subsystem | Status |
| --- | --- | --- |
| `system.md` | Architecture and integration: how every subsystem fits together | Not started |
| `platform.md` | Platform and dev environment | Not started |
| `drivetrain.md` | Drivetrain | Not started |
| `mechanism.md` | Mechanism control | Not started |
| `teleoperation.md` | Teleoperation and operator station | Not started |
| `sensors.md` | Sensors and robot model | Not started |
| `autonomy.md` | Autonomy | Not started |

When you add a doc, link it in this table and keep its status current.

## Start a design doc

1. Copy [the template](template.md) to `docs/design/<subsystem>.md`, using the file name
   from the table above.
2. Fill in the header: owner, pair, status `Draft`, and today's date.
3. Fill in every section. Write "None" rather than deleting a section, so readers know it
   was considered.
4. Delete every quote block in the template that starts with **Delete this**.
5. Add the doc to the `Design docs` section of the `nav` list in `mkdocs.yml`, in the same
   order as the table above, so it appears on the website.
6. Open a pull request. Design docs get the same review as code, plus the software lead's.

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
- **A pull request that changes an interface updates the design doc in the same pull
  request.** Reviewers reject pull requests where the code and the doc disagree.

## Diagrams

Draw diagrams in [Mermaid](https://mermaid.js.org/syntax/flowchart.html), in a fenced
`mermaid` code block. GitHub renders Mermaid, changes show up in diffs like code, and the
template has an example. VS Code in the dev container previews Mermaid in its Markdown
preview.
