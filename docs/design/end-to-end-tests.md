# End-to-end test procedures

Each procedure follows one thing the robot does through every node it crosses, from
the operator or the hardware to the motors. Each step names the node that acts, the
interface it uses, and the budget it spends, and the pass lines come from the
[performance budgets](performance-budgets.md) and the design docs' requirements.

- **Before anything runs, the design review walks each procedure on paper,** with
  whoever works on each step explaining it. A step nobody can explain, or a name still
  `[TBD]`, is a gap to settle.
- **Then each one runs at Sim, Bench, and Robot,** as [Testing layers](testing-layers.md)
  describes, and each run is recorded in the test-run sheet.

This page is generated from `docs/design/end-to-end-tests.toml` by
`scripts/design render`. The results come from the test-run sheet when the website builds.

## Recording a run

Open the procedure's tab in the [test-run sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit). Each run takes two columns, Result and Note. In the first empty pair, pick the layer (Sim, Bench, or Robot) and type the date, such as 2026-12-02. Mark each pass line Pass or Fail, type each value it measured, link the log, and write a note beside any row. Leave the first column alone: it must match each procedure's pass lines here, and the website flags any row that drifts. `scripts/design sheet` prints the first column for every procedure, for a new tab.

## Results

The latest run of each procedure at each layer. A run is Fail when any pass line failed,
Pass when every one passed, and Incomplete until each is marked.

<!-- test-runs: summary -->

## The stick moves the wheels

Follows a TELEOP drive command from the gamepad to the drive motors: through the operator frontend, rosbridge, teleop_node, command selection, and the drivetrain.

**Measures:** [TPM-6](performance-budgets.md#tpm-6-average-link-bandwidth-over-a-run).

| Step | Who | What happens | Interface | Budget |
| --- | --- | --- | --- | --- |
| 1 | Operator, through the Operator frontend | Enables the robot in TELEOP and TRAVEL from the laptop controls | `/robot/request_mode` |   |
| 2 | `mode_manager` | Accepts the request and publishes ENABLED, TELEOP, TRAVEL | `/robot/mode` |   |
| 3 | Operator | Holds LB and pushes the left stick forward (the teleop draft's mapping) |   |   |
| 4 | Operator frontend | Reads the stick through the Gamepad API and sends it over rosbridge | `/joy` | [TPM-6](performance-budgets.md#tpm-6-average-link-bandwidth-over-a-run) |
| 5 | `teleop_node` | Turns the fresh input into a drive command, since LB is held | `/teleop/cmd_vel` |   |
| 6 | Command selection node | Passes TELEOP's command on, since /robot/mode names TELEOP | `/cmd_vel` |   |
| 7 | Drivetrain node | Sends each side's speed to its motor controllers over CAN, within TRAVEL's current limit |   |   |
| 8 | Operator | Releases LB |   |   |
| 9 | `teleop_node` | Zeroes the drive command | `/teleop/cmd_vel` |   |

**It passes when:**

- The wheels turn forward while LB is held and the stick is pushed, and stop when LB is released (teleop draft R2).
- With the TELEOP default view, camera on, the link averages under 1,000 kbit/s (TPM-6).
- [TBD: a pass line for button-to-motor latency, from the teleop draft's tc netem test, teleoperation doc (5.1)]

**Runs,** from [its tab in the test-run sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit#gid=273900859):

<!-- test-runs: stick-drives-wheels -->

## The operator link drops

Follows the loss of the operator's heartbeat to zero output at every motor, in TELEOP and in AUTO (operating modes R3).

**Measures:** [TPM-8](performance-budgets.md#tpm-8-stop-time-after-link-loss).

| Step | Who | What happens | Interface | Budget |
| --- | --- | --- | --- | --- |
| 1 | `mode_manager` | Has the robot ENABLED and driving, wheels off the ground | `/robot/mode` |   |
| 2 | Tester | Pulls the access point's Wi-Fi; in a separate run, closes the operator frontend while the Wi-Fi stays up and the robot still answers pings |   |   |
| 3 | Operator frontend | Stops sending the heartbeat | `/operator/heartbeat` | [TPM-8](performance-budgets.md#tpm-8-stop-time-after-link-loss) |
| 4 | `mode_manager` | Hears no heartbeat for link_timeout and publishes DISABLED, with the reason "link lost" | `/robot/mode` | [TPM-8](performance-budgets.md#tpm-8-stop-time-after-link-loss) |
| 5 | Drivetrain node | Sends zero output in its next control loop | `/robot/mode` | [TPM-7](performance-budgets.md#tpm-7-stop-time-after-a-disable-command) |
| 6 | Mechanism node | Sends zero output in its next control loop | `/robot/mode` | [TPM-7](performance-budgets.md#tpm-7-stop-time-after-a-disable-command) |
| 7 | Tester | Restores the link |   |   |

**It passes when:**

- Every output is zero within 600 ms of the last heartbeat, 3 of 3, timed from the recording (TPM-8).
- When the link comes back, nothing moves until the operator enables the robot again, and a burst of late heartbeats does not enable it (teleop draft R4).
- [TBD: no false disables in a 10-minute tc netem run, at a packet loss rate the radio link evaluation (5.7) sets]

**Runs,** from [its tab in the test-run sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit#gid=1450027895):

<!-- test-runs: link-loss -->

## The battery runs low

Follows a sagging battery voltage to halved current limits, with the robot still running (operating modes R7 and section 7).

| Step | Who | What happens | Interface | Budget |
| --- | --- | --- | --- | --- |
| 1 | PDP | Sends the battery voltage in its status frames. In Sim, the fake power panel sends scripted frames instead. |   |   |
| 2 | Power panel reading node | Decodes the frames and publishes the voltage | `/power/battery` |   |
| 3 | `mode_manager` | Warns the operator below cell_warn_v (14.0 V for 4 cells), and halves every current limit after low_voltage_hold (2.0 s) below cell_critical_v (13.2 V) | `/power/battery` |   |
| 4 | Drivetrain node | Halves its current limits [TBD: how it learns to, drivetrain doc (3.1)] |   |   |
| 5 | Mechanism node | Halves its current limits [TBD: how it learns to, mechanism doc (4.2)] |   |   |
| 6 | Operator frontend | Shows the battery voltage and the warning | `/power/battery` |   |

**It passes when:**

- The operator is warned at 14.0 V, every current limit halves after 2.0 s below 13.2 V, a dip shorter than 2 s changes nothing, and the robot stays ENABLED.

**Runs,** from [its tab in the test-run sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit#gid=1527623844):

<!-- test-runs: battery-low -->

## The E-stop is pressed

Follows an E-stop press with no software in its path, and shows that moving again takes two operator actions (operating modes R4 to R6).

| Step | Who | What happens | Interface | Budget |
| --- | --- | --- | --- | --- |
| 1 | Tester | Presses the E-stop while the robot is ENABLED and driving |   |   |
| 2 | E-stop | Cuts the main battery from every controller. The energy loggers and the robot computer, on its own battery, stay powered. |   |   |
| 3 | `mode_manager` | Sees every motor controller's status go missing, and enters FAULT with the reason "main power lost" | `/robot/mode` |   |
| 4 | Operator frontend | Shows FAULT and its reason | `/robot/mode` |   |
| 5 | Tester | Resets the E-stop |   |   |
| 6 | Operator, through the Operator frontend | Clears the fault, then separately requests ENABLED | `/robot/request_mode` |   |

**It passes when:**

- Nothing moves from the press until the operator has cleared the fault and enabled again.
- With the E-stop pressed, every rail reads zero except the energy loggers and the robot computer's battery.
- The energy logger's reading is the same before the press and after the reset.

**Runs,** from [its tab in the test-run sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit#gid=10490958):

<!-- test-runs: e-stop -->

## One AUTO cycle

Follows a full autonomous cycle, dig, travel loaded, dump, and travel back, with no operator input after AUTO is enabled.

**Measures:** [TPM-1](performance-budgets.md#tpm-1-autonomous-cycles-completed-per-run), [TPM-2](performance-budgets.md#tpm-2-autonomous-cycle-time), [TPM-3](performance-budgets.md#tpm-3-time-from-run-start-to-the-first-cycle-starting), [TPM-4](performance-budgets.md#tpm-4-obstacle-contacts-per-run), [TPM-6](performance-budgets.md#tpm-6-average-link-bandwidth-over-a-run), [TPM-10](performance-budgets.md#tpm-10-energy-used-per-autonomous-cycle), [TPM-11](performance-budgets.md#tpm-11-robot-computer-processor-load-averaged-over-a-run).

| Step | Who | What happens | Interface | Budget |
| --- | --- | --- | --- | --- |
| 1 | Operator, through the Operator frontend | Tells the judge, then enables the robot in AUTO from the laptop controls | `/robot/request_mode` | [TPM-3](performance-budgets.md#tpm-3-time-from-run-start-to-the-first-cycle-starting) |
| 2 | `mode_manager` | Publishes ENABLED, AUTO | `/robot/mode` |   |
| 3 | Task sequencer | Requests EXCAVATE | `/robot/request_task` | [TPM-2](performance-budgets.md#tpm-2-autonomous-cycle-time) |
| 4 | Task sequencer | Sends the mechanism commands that dig until the bin is full | [TBD: AUTO mechanism command topic, teleop open question 3] | [TPM-2](performance-budgets.md#tpm-2-autonomous-cycle-time) |
| 5 | Command selection node | Passes AUTO's commands on, and drops teleop's | [TBD: mechanism command topic, teleop open question 3] |   |
| 6 | Mechanism node | Digs within EXCAVATE's limits and reports when the excavator is stowed | `/mechanism/status` | [TPM-9](performance-budgets.md#tpm-9-peak-current-in-the-worst-task-mode) |
| 7 | Task sequencer | Requests TRAVEL once the excavator is stowed | `/robot/request_task` |   |
| 8 | Localization and mapping | Keeps the robot's position and the obstacle map current | [TBD: obstacle map topic, autonomy doc (7.2)] | [TPM-5](performance-budgets.md#tpm-5-position-error-after-a-2-minute-drive) |
| 9 | Path planning and following | Plans a path to the construction zone around the mapped obstacles, and follows it | [TBD: AUTO drive command topic, teleop open question 3] | [TPM-4](performance-budgets.md#tpm-4-obstacle-contacts-per-run) |
| 10 | Drivetrain node | Drives within TRAVEL's limits | `/cmd_vel` |   |
| 11 | Task sequencer | Requests DUMP, then opens the hatch and runs the conveyor | [TBD: AUTO mechanism command topic, teleop open question 3] | [TPM-2](performance-budgets.md#tpm-2-autonomous-cycle-time) |
| 12 | Task sequencer | Requests TRAVEL, and the robot drives back to dig again | `/robot/request_task` |   |
| 13 | Operator frontend | Shows the AUTO default view throughout: the obstacle map and the planned path | [TBD: planned path topic, autonomy doc (7.2)] | [TPM-6](performance-budgets.md#tpm-6-average-link-bandwidth-over-a-run) |

**It passes when:**

- The cycle completes with no operator input after AUTO is enabled (TPM-1).
- The cycle takes at most 7.0 min, with a goal of 6.0 min (TPM-2).
- The cycle starts within 300 s of the run's start, with a goal of 60 s (TPM-3).
- The robot touches no obstacle (TPM-4).
- The link averages under 1,000 kbit/s with the AUTO default view (TPM-6).
- The energy the cycle uses is recorded, as the baseline for later runs (TPM-10).
- The robot computer's processor load averages under 70% (TPM-11).

**Runs,** from [its tab in the test-run sheet](https://docs.google.com/spreadsheets/d/1qYh5hzQPgHA6WQpqN9SrjHDDrfeMzqhxvYa_3uOBYCk/edit#gid=1483942929):

<!-- test-runs: auto-cycle -->
