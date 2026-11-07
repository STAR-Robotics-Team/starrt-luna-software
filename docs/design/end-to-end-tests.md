# End-to-end test procedures

Each procedure follows one thing the robot does through every node it crosses, from
the operator or the hardware to the motors. Each step names who acts, the interface it
uses, and the budget it spends, and the pass lines come from the
[performance budgets](performance-budgets.md) and the design docs' requirements.

- **Before anything runs, the design review walks each procedure on paper,** with
  whoever works on each step explaining it. A step nobody can explain, or a name still
  `[TBD]`, is a gap to settle.
- **Then each one runs at Sim, Bench, and Robot,** as [Testing layers](testing-layers.md)
  describes, and each run is recorded beside its steps.

The procedures and their runs live in the [test sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit), one tab per procedure. This page
reads the sheet each time it opens, so it shows the sheet as it is now.

## Writing a procedure

In the [test sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit), choose **Test procedures > New procedure** and give it a name: the
name is its title here. Write its purpose above the table, then one row for each:

- **Step:** who acts (a node, or an actor such as the operator), what happens, the
  interface it uses, and the TPM whose budget it spends, in order.
- **Pass:** what must be true for a run to pass, and the TPM it checks, if any.
- **Measure:** a TPM each run records.

Pick nodes, interfaces, and TPMs from the dropdowns. They come from the design
registries, so a procedure names only what the design docs define. A pull request that
renames or removes a node, interface, or TPM that a procedure uses fails
`scripts/design check` until the procedure is updated too.

## Recording a run

Open the procedure's tab. Each run takes two columns, Result and Note. In the first
empty pair, pick the layer (Sim, Bench, or Robot) and type the date, such as
2026-12-02. Mark each step and pass line Pass or Fail as you go, type each value
measured, link the log, and write a note beside any row.

## How this page stays current

- **The page reads the sheet in your browser each time it opens.** Google takes up to
  about 5 minutes to publish an edit, so an edit shows here a few minutes after it is
  made. When the page can't read the sheet, it shows the sheet as of the website's last
  build, and says so.
- **Site search knows the procedures as of the last build.** Once edits have stopped
  for six minutes, by when Google has published them, the sheet asks GitHub to rebuild
  the website. The website also rebuilds every hour, so search catches up within about
  10 minutes, or within the hour.
- **The sheet's script asks for the rebuilds:** [`scripts/test-sheet.gs`](https://github.com/STAR-Robotics-Team/starrt-luna-software/blob/main/scripts/test-sheet.gs). It
  needs a GitHub token in its script properties. When the token stops working, the
  sheet's "How to record a run" tab says so, and the hourly rebuild carries on. To
  renew it, a STAR-Robotics-Team admin creates a fine-grained token (GitHub, Settings,
  Developer settings, Fine-grained tokens) owned by STAR-Robotics-Team, for this
  repository only, with the Actions permission set to read and write. Then, in the
  sheet, open Extensions, Apps Script, Project settings, and set the script property
  `GITHUB_TOKEN` to it.

## Results

The latest run of each procedure at each layer. A run is Fail when any step or pass
line failed, Pass when every one passed, and Incomplete until each is marked.

<!-- test-sheet: summary -->

<!-- test-sheet: procedures -->

<!-- test-sheet: data -->
