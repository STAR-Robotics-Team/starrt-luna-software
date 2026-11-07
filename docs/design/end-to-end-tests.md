# End-to-end test procedures

Each procedure is a step-by-step walkthrough of one thing the robot does, through every
node it crosses, from the operator or the hardware to the motors. Each step says exactly
what to do and exactly what must be seen for it to pass, and names the node and
interface it checks, the [performance budget](performance-budgets.md) it spends, and the
TPM it measures.

- **Before anything runs, the design review walks each procedure on paper,** with
  whoever works on each step explaining it. A step nobody can explain, or a name still
  `[TBD]`, is a gap to settle.
- **Then each one runs with each hardware system in the modes of
  [Hardware test modes](hardware-test-modes.md),** from stand-ins on a laptop to the
  rover, as [Testing layers](testing-layers.md) describes, and each run is recorded
  beside its steps.

The procedures and their runs live in the [test sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit), one tab per procedure. This page
reads the sheet each time it opens, so it shows the sheet as it is now.

## Writing a procedure

In the [test sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit), choose **Test procedures > New procedure** and give it a name: the
name is its title here. Write its purpose above the table, then:

- **One row for each hardware system the procedure uses,** under Date, with the
  system's name in column A, such as Radio link. Each run picks that system's mode.
- **One row for each step, in the order it happens,** from setting up (the
  recording, the launch, each terminal to watch) to tearing down (stopping the
  recording, noting the commit, linking the log). The sheet numbers the steps in
  column A, and this page uses the same numbers. Write each step so that someone who
  has never run it can follow it:
    - **Do:** exactly what to do, where, and with which tool or exact command.
    - **Pass when:** exactly what must be seen, where, and within what limit.
    - **Applies when:** one or more chips, such as Radio link: Bench, when the step is
      only for some modes. Chips for the same system mean any of those modes, and chips
      for different systems mean all of them. Leave it blank for a step in every run.
    - **Actor, Node, and Interface:** who acts, and the node and interface the step checks.
    - **Budget:** the TPM whose budget the step spends.
    - **Measures:** the TPM the step measures. A run can then type the measured number
      instead of Pass or Fail.

Write a name that is not settled yet, such as a launch argument, as a `[TBR]` or `[TBD]`
marker that says where it gets settled, as in any doc; the
[open items](open-items.md#marked-in-the-test-sheet) page lists each one.

Pick nodes, interfaces, TPMs, and test modes from the dropdowns. They come from the
design registries and the headings of Hardware test modes, so a procedure names only
what the design docs define. A pull request that renames or removes one that a procedure
uses fails `scripts/design check` until the procedure is updated too.

## Recording a run

Open the procedure's tab and choose **Test procedures > Add a run**. Each run takes two
columns, Result and Note: it dates the first empty pair, adding one when none is left.
Pick each system's mode in the rows under Date, and the cells of the steps that are not
in this run turn gray. Then follow the other steps in order, and mark each one Pass or
Fail as you go. For a step that measures a TPM, you can type the measured number
instead: this page judges it against the TPM, and a number that misses the threshold
fails the step. Link the log, and write a note beside any row.

Below, each procedure shows only the steps for the modes you pick above its steps, so
you can follow it for a run before you start. Pick a run instead, or a date in its runs
table, to see that run's marks beside its steps.

A run's layer is the highest layer among its systems' modes, so a run on the drive base
with every sensor on its stub counts as Robot.

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

The latest run of each procedure at each layer. A run is Fail when any of its steps
failed, Pass when every one passed, and Incomplete until each is marked.

<!-- test-sheet: summary -->

<!-- test-sheet: procedures -->

<!-- test-sheet: data -->
