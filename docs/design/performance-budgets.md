# Performance budgets

The technical performance measures (TPMs) the robot software is held to, and how each
one is split across the software elements in the
[system design](system.md#software-elements). Each TPM is one measurable quantity with
one unit:

- **Source** is the higher-level requirement it tracks: a TPM in the PMP's Table 3, and
  the guidebook rule behind it. "Derived" means the PMP has no matching TPM, and the
  measure protects the ones it names.
- **Threshold** is the least acceptable value, and **goal** is the target, as in PMP
  Table 3.
- **Not allocated to software:** berm volume (software affects it only through TPM-1),
  dimensions, and dust tolerance. They belong to the hardware.

Each design doc shows its own elements' budgets in its Budgets table. To change a
budget, edit `performance-budgets.toml` and run `scripts/design render`. The check
fails when a budget's parts add up to more than its limit, and every margin and total
here is computed, not typed.

This page is generated from `docs/design/performance-budgets.toml` by
`scripts/design render`.

## Measures

| ID | Measure | Unit | Source | Threshold | Goal | Budget | Measured by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TPM-1 | Autonomous cycles completed per run (excavate, travel, dump, travel, with no operator input) | cycles per run | PMP: Excavation/dump cycles; Autonomous capabilities. Guidebook §16.4, §16.5 | ≥1 | ≥2, starting in the starting zone (full autonomy) | [Which elements make each task autonomous](#tpm-1-autonomous-cycles-completed-per-run) | [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-2 | Autonomous cycle time | min per cycle | PMP: Excavation/dump cycles. Guidebook §12 (15-minute runs) | ≤7.0 [TBR: proposed in the PDR (1.6)] | ≤6.0 [TBR: proposed in the PDR (1.6)] | [Budget for the 6.0 min (360 s) goal](#tpm-2-autonomous-cycle-time) | [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-3 | Time from run start to the first cycle starting | s | Guidebook §15.3.1 (a cycle must start within 5 minutes or the run ends); §13.9.3 (random start position and direction) | ≤300 | ≤60 [TBR: proposed in the PDR (1.6)] | [Budget for the 60 s goal](#tpm-3-time-from-run-start-to-the-first-cycle-starting) | [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-4 | Obstacle contacts per run | contacts per run | PMP: Navigation and obstacles. Guidebook §17.1.8 (−50 points, then −25 each, up to −100) | ≤1 [TBR: proposed in the PDR (1.6)] | 0 | [Clearance budget and detection](#tpm-4-obstacle-contacts-per-run) | [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-5 | Position error after a 2-minute drive | m | PMP: Navigation and obstacles. Guidebook §13.7 (no GPS or compass), §16.3 (no prior knowledge of the arena) | ≤0.20 [TBR: proposed in the PDR (1.6)] | ≤0.10 [TBR: proposed in the PDR (1.6)] | [Error budget for the 0.10 m goal](#tpm-5-position-error-after-a-2-minute-drive) | None yet |
| TPM-6 | Average link bandwidth over a run | kbit/s | PMP: Communications bandwidth. Guidebook §14.1.19 (4,000 kbit/s average limit), §17.1.4 (score) | ≤4,000 | ≤1,000, which scores 90 of 120 [TBR: proposed in the PDR (1.6)] | [Budget by sending element (kbit/s)](#tpm-6-average-link-bandwidth-over-a-run) | [The stick moves the wheels](end-to-end-tests.md#the-stick-moves-the-wheels), [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-7 | Stop time after a disable command (request received on the robot, to zero output at every motor controller) | ms | Guidebook §13.9.19 (power-off command), §15.4.1 (stop when time is up) | ≤100 | ≤100 | [Delay budget (ms)](#tpm-7-stop-time-after-a-disable-command) | None yet |
| TPM-8 | Stop time after link loss (last heartbeat received, to zero output) | ms | Guidebook §13.9.19 (without the link, the robot can't hear the power-off command) | ≤600 | ≤600 | [Delay budget (ms)](#tpm-8-stop-time-after-link-loss) | [The operator link drops](end-to-end-tests.md#the-operator-link-drops) |
| TPM-9 | Peak current in the worst task mode (EXCAVATE) | A | PMP: Berm and energy productivity (power). Main breaker in Electrical's power budget | Below the main breaker rating, 150 A in operating modes [TBR: Electrical's power budget workbook sizes it at 170 to 175 A] | ≤135 | [Allocation in EXCAVATE, the worst mode (A)](#tpm-9-peak-current-in-the-worst-task-mode) | None yet |
| TPM-10 | Energy used per autonomous cycle | Wh per cycle | PMP: Berm and energy productivity. Guidebook §17.1.3 (points = 1.5 × berm cm³ ÷ run minutes ÷ Wh) | A baseline [TBD: measured on the first full robot cycle] | Below the baseline (PMP: improve) | [Allocation by phase (Wh)](#tpm-10-energy-used-per-autonomous-cycle) | [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-11 | Robot computer processor load, averaged over a run | % of all CPU cores | Derived: protects PMP Autonomous capabilities and Navigation and obstacles, since all robot software shares one computer | ≤85 [TBR: proposed in the PDR (1.6)] | ≤70 [TBR: proposed in the PDR (1.6)] | [Allocation (% of all CPU cores)](#tpm-11-robot-computer-processor-load-averaged-over-a-run) | [One AUTO cycle](end-to-end-tests.md#one-auto-cycle) |
| TPM-12 | Restart time (power-on to DISABLED with position known) | s | Derived: Guidebook §15.3.3 and §15.3.4 (a long restart can look like a dead robot); §15.3.1 | ≤180 [TBR: proposed in the PDR (1.6)] | ≤120 [TBR: proposed in the PDR (1.6)] | [Budget for the 120 s goal](#tpm-12-restart-time) | None yet |
| TPM-13 | Mass | kg | PMP: Weight | 0 | 0 | 0 kg for every software element, at every level | None yet |

## Measurements

The latest value each TPM measured at each layer, from the runs in the
[test-run sheet](end-to-end-tests.md#recording-a-run), judged against its threshold
and goal. The website reads the sheet when it builds.

<!-- test-runs: measurements -->

## Budgets

### TPM-1: Autonomous cycles completed per run

Which elements make each task autonomous.

| Autonomous task (guidebook) | Elements responsible | Points |
| --- | --- | --- |
| Excavation (§16.1) | SW.2.4 decides when to dig and stop; SW.1.3 digs; SW.2.2 confirms the robot is in the excavation zone | 200 |
| Travel (§16.3) | SW.2.2 localizes and maps; SW.2.3 plans and follows; SW.1.2 drives | 500 |
| Dump (§16.2) | SW.2.4 decides; SW.1.3 opens the hatch and runs the conveyor; SW.2.2 confirms the construction zone | 100 |
| Full autonomy (§16.5): at least 2 cycles, starting in the starting zone | All of the above, plus SW.1.1 (stays enabled), SW.1.5 (passes AUTO commands), SW.3.1 (heartbeat), and SW.4 (link and logging) | 1,400 × berm factor |

- **Link to berm volume:** the number of cycles needed for a 25 L berm is 25 L divided by the liters delivered per trip, which Mechanical sets. So two cycles need at least 12.5 L delivered per trip.

### TPM-2: Autonomous cycle time

Budget for the 6.0 min (360 s) goal.

| Phase | Elements | Allocation (s) | Basis |
| --- | --- | --- | --- |
| Excavate until the bin is full | SW.1.3 runs the excavator; SW.2.4 decides when to stop | ≤150 | [TBR: dig rate and bin volume, with Mechanical (4.1)] |
| Travel loaded across the obstacle zone (4.38 m long) | SW.2.3 plans and follows; SW.2.2 localizes; SW.1.2 drives | ≤60 | [TBR: proposed in the PDR (1.6)] |
| Dump | SW.1.3 opens the hatch and runs the conveyor | ≤60 | [TBR: with Mechanical (4.1)] |
| Travel empty back | SW.2.3, SW.2.2, SW.1.2 | ≤60 | [TBR: proposed in the PDR (1.6)] |
| Task-mode switches (4 per cycle) | SW.2.4 requests; SW.1.1 grants | ≤4 (≤1 each) | [TBR: proposed in the PDR (1.6)] |
| **Total** |   | **334** of 360, leaving 26 |   |

- **Threshold:** a 15-minute run, minus 1 minute to start (TPM-3 goal), split over 2 cycles, gives 7.0 min. The goal keeps 2 minutes of margin.
- **If 2 trips can't reach 25 L,** cycle time must drop to 14 min divided by the number of cycles needed.

### TPM-3: Time from run start to the first cycle starting

Budget for the 60 s goal.

| Step | Elements | Allocation (s of run time) |
| --- | --- | --- |
| Find position and heading from the random start | SW.2.2 | 0, since it is done during the 10-minute setup while the robot sits still (≤60 s of setup time) [TBR: proposed in the PDR (1.6)] |
| Operator enables in AUTO (after telling the judge) | SW.3.1 sends; SW.1.1 accepts | ≤5 |
| Sequencer picks a dig spot and starts | SW.2.4 | ≤2 |
| Drive to the dig spot (the excavation zone includes the starting zone) | SW.2.3, SW.1.2 | ≤20 |
| **Total** |   | **27** of 60, leaving 33 |

### TPM-4: Obstacle contacts per run

Clearance budget and detection.

| Contributor | Elements | Allocation | Unit |
| --- | --- | --- | --- |
| Position error | SW.2.2 | 10 (TPM-5 goal) | cm |
| Map cell size | SW.2.2 | 5 [TBR: proposed in the PDR (1.6)] | cm |
| Path-following error | SW.2.3 with SW.1.2 | 10 [TBR: proposed in the PDR (1.6)] | cm |
| Error in the robot's outline in the robot model | SW.2.1, from Mechanical's CAD | 2 [TBR: proposed in the PDR (1.6)] | cm |
| **Clearance the planner keeps from every mapped obstacle, at least: the sum of the rows above** | SW.2.3 | **27** | cm |
| Smallest rock mapped (guidebook §11.4: rocks are 30 to 40 cm across) | SW.2.1, SW.2.2 | 30 | cm across |
| Smallest crater mapped (craters are about 40 to 50 cm wide) | SW.2.1, SW.2.2 | 40 | cm wide |
| Detection range | SW.2.1, SW.2.2 | ≥2.0 [TBR: proposed in the PDR (1.6)] | m |

### TPM-5: Position error after a 2-minute drive

Error budget for the 0.10 m goal.

| Contributor | Elements | Allocation | Unit |
| --- | --- | --- | --- |
| Wheel odometry error around a 2 m square | SW.1.2 | [TBD: measured in 3.9 (Gazebo) and 3.7 (robot); it needs drive encoders, which 6.1 has not confirmed] | m |
| IMU heading drift | SW.2.1 | [TBD: sensor suite evaluation (6.1)] | ° per min |
| Sensor position error in the robot model | SW.2.1 | ≤0.01, from CAD [TBR: proposed in the PDR (1.6)] | m |
| Sensor timestamp mismatch | SW.2.1, SW.4 | ≤10 [TBR: proposed in the PDR (1.6)] | ms |
| Combined estimate (LiDAR, IMU, odometry) | SW.2.2 | ≤0.10 | m |

- **These errors don't simply add up.** SW.2.2 owns the total.
- **How it's measured:** against the true position in Gazebo (7.5), and against tape marks on the floor for the robot.

### TPM-6: Average link bandwidth over a run

Budget by sending element (kbit/s).

| What it sends over the link | Elements | TELEOP (default view) | AUTO (default view) |
| --- | --- | --- | --- |
| /robot/mode, 10 Hz | SW.1.1 | 20 | 20 |
| Drivetrain data [TBR: drivetrain doc (3.1)] | SW.1.2 | 50 | 50 |
| Stowed and hatch status [TBD: mechanism doc (4.2)] | SW.1.3 | 20 | 20 |
| /power/battery, 10 Hz | SW.1.4 | 30 | 30 |
| Nothing: it runs on the robot | SW.1.5 | 0 | 0 |
| Compressed driving camera, as CBOR on its own connection: on by default in TELEOP, and the operator can turn it on in AUTO | SW.2.1 | 750 | 0 |
| Obstacle map, on by default in AUTO (a 5 cm grid of the arena is about 110 kbit per update) | SW.2.2 | 0 | 150 |
| Planned path, on by default in AUTO | SW.2.3 | 0 | 50 |
| Nothing | SW.2.4 | 0 | 0 |
| /joy, the heartbeat, and mode requests (laptop to robot) | SW.3.1 | 50 | 50 |
| Nothing: it runs on the robot | SW.3.2 | 0 | 0 |
| rosbridge connection overhead (WebSocket over TCP) [TBR: measured in 5.6] | SW.4 | 30 | 30 |
| **Total** |   | **950** of 1,000, leaving 50 | **400** of 1,000, leaving 600 |

- **With the default views, any mix of TELEOP and AUTO averages under the 1,000 kbit/s goal.**
- **Turning the camera on in AUTO adds 750 kbit/s** (1,150 in total, over the goal). The frontend shows live link bandwidth so the operator can see the cost (PR #14 review, 2026-10-26).
- **Over rosbridge, each sender's number includes its encoding** (JSON, or CBOR for the camera) [TBR: measured in 5.6].
- **Arena cameras:** each one used during the run adds 500 kbit/s to the scored total (§14.1.18). This budget assumes none. Using them during setup is free.

### TPM-7: Stop time after a disable command

Delay budget (ms).

| Step | Elements | Allocation (ms) |
| --- | --- | --- |
| Accept the disable request and publish DISABLED | SW.1.1 | ≤10 |
| Receive DISABLED and send zero output on CAN, in the next 50 Hz control loop | SW.1.2 and SW.1.3, in parallel | ≤90 |
| **Total** |   | **100** of 100, leaving 0 |
| Backstop if software hangs: the motor controllers disable themselves 100 ms after the enable signal stops | Motor controllers (Electronic, not Software) | 100, not counted |

- **If the mode manager itself stops,** the drivetrain and mechanism treat a `/robot/mode` older than `mode_timeout` (0.3 s) as DISABLED, so output is zero within 400 ms (drivetrain draft R3).

### TPM-8: Stop time after link loss

Delay budget (ms).

| Step | Elements | Allocation (ms) |
| --- | --- | --- |
| Declare the link lost | SW.1.1 | 500 after the last heartbeat (`link_timeout`) [TBR: operating modes open question 9] |
| Disable chain (TPM-7) | SW.1.1, SW.1.2, SW.1.3 | ≤100 |
| **Total** |   | **600** of 600, leaving 0 |
| Send a heartbeat every 100 ms, which sets how soon a loss can be seen | SW.3.1 | 100 (the period), not counted |

- **The link is TCP (rosbridge).** After a Wi-Fi stall, heartbeats and commands can arrive late, in a burst. The mode manager judges each heartbeat by when it arrived (deliverable 1.8), so a burst that arrives after the robot has disabled doesn't enable it again.
- **SW.3.2 drops gamepad input older than `input_timeout`** (0.15 s) [TBR: teleoperation doc (5.1)].
- **Stale input:** [TBD: how SW.3.2 tells stale input from fresh, since the laptop's and the robot's clocks differ, teleoperation doc (5.1)].

### TPM-9: Peak current in the worst task mode

Allocation in EXCAVATE, the worst mode (A).

| Load | Element that sets the limit | Allocation (A) |
| --- | --- | --- |
| Drive, 4 motors at 15 A (creep, 20% output) | SW.1.2 | 60 |
| Excavator chain | SW.1.3 | 30 |
| Depth actuators, 2 at 15 A | SW.1.3 | 30 |
| Conveyor (the NeveRest stalls at 11.5 A, so it needs no limit) | SW.1.3 | 11.5 |
| Hatch (off in EXCAVATE) | SW.1.3 | 0 |
| **Total** |   | **131.5** of 135, leaving 3.5 |
| Electronics on the main battery | Electrical (power budget workbook) | [TBR: Electrical's power budget workbook], not counted |

- **TRAVEL is the next-worst mode:** 4 drive motors at 30 A is 120 A, plus electronics.
- **The limits come from operating modes** [TBR: for Electrical to confirm].
- **Victor SPX followers can't limit current.** The 15 A per drive motor holds only if each follower draws like its Talon leader [TBR: drivetrain doc (3.1)]. The Talon FXS controllers the team plans to buy can limit current [TBR: the grant (1.16)].

### TPM-10: Energy used per autonomous cycle

Allocation by phase (Wh).

| Phase | Elements that control it | Allocation (Wh) |
| --- | --- | --- |
| Excavate | SW.1.3 (limits, and how it digs) | [TBD: baseline] |
| Travel, loaded and empty | SW.1.2 (limits), SW.2.3 (path length) | [TBD: baseline] |
| Dump | SW.1.3 | [TBD: baseline] |
| Electronics on the main battery over the cycle (LiDAR, radio, controllers) | Electrical; shrinks as TPM-2 shrinks | [TBD: baseline] |
| Measuring it: energy per task mode, checked against the main energy logger | SW.1.4 logs it | None: it measures |

- **The robot computer has its own battery and energy logger.** Whether the judges count that energy is operating modes open question 8 (ask the organizers).

### TPM-11: Robot computer processor load, averaged over a run

Allocation (% of all CPU cores).

| Element | Elements | Allocation (%) |
| --- | --- | --- |
| Localization and mapping | SW.2.2 | [TBD: autonomy doc v1 (7.8)]; expected to be the largest share |
| Path planning and following | SW.2.3 | [TBD: autonomy doc v1 (7.8)] |
| Sensor drivers, including camera compression | SW.2.1 | [TBD: autonomy doc v1 (7.8)] |
| Task sequencer | SW.2.4 | [TBD: autonomy doc v1 (7.8)] |
| Robot control | SW.1.1 to SW.1.5 | [TBD: autonomy doc v1 (7.8)] |
| Teleop mapping | SW.3.2 | [TBD: autonomy doc v1 (7.8)]; expected to be small |
| Bringup, link (rosbridge), and logging | SW.4 | [TBD: autonomy doc v1 (7.8)] |

- **The computer may change.** The robot computer is the Jetson Orin Nano today. It becomes an ASRock 4X4 BOX-AI340 mini PC if the Hacker Initiative grant pays for one (system open question 7). That would change every share.

### TPM-12: Restart time

Budget for the 120 s goal.

| Step | Elements | Allocation (s) |
| --- | --- | --- |
| Operating system boots | SW.4 (robot computer configuration) | [TBD: measured in 2.10] |
| Every robot program starts | SW.4 | [TBD: measured in 2.10] |
| Self-test finds every CAN device | SW.1.1 | ≤10, with FAULT at 60 [TBR: proposed in the PDR (1.6)] |
| Sensor drivers publishing | SW.2.1 | [TBD: sensors doc (6.2)] |
| Position found | SW.2.2 | ≤60 (as in TPM-3) |
| **Total** |   | **70** of 120, leaving 50, not counting the parts still TBD |

- **An E-stop no longer reboots the computer,** since it has its own battery. This budget matters for power-on during setup and for a computer reset mid-run.

## What each element carries

The TPMs whose budgets name each element. A parent carries what its children carry,
and every element also carries TPM-13 (0 kg).

| Element | TPMs |
| --- | --- |
| SW Robot software | TPM-1, TPM-2, TPM-3, TPM-4, TPM-5, TPM-6, TPM-7, TPM-8, TPM-9, TPM-10, TPM-11, TPM-12 |
| SW.1 Robot control software | TPM-1, TPM-2, TPM-3, TPM-4, TPM-5, TPM-6, TPM-7, TPM-8, TPM-9, TPM-10, TPM-11, TPM-12 |
| SW.1.1 Mode manager | TPM-1, TPM-2, TPM-3, TPM-6, TPM-7, TPM-8, TPM-11, TPM-12 |
| SW.1.2 Drivetrain control | TPM-1, TPM-2, TPM-3, TPM-4, TPM-5, TPM-6, TPM-7, TPM-8, TPM-9, TPM-10, TPM-11 |
| SW.1.3 Mechanism control | TPM-1, TPM-2, TPM-6, TPM-7, TPM-8, TPM-9, TPM-10, TPM-11 |
| SW.1.4 Power telemetry | TPM-6, TPM-10, TPM-11 |
| SW.1.5 Command selection | TPM-1, TPM-6, TPM-11 |
| SW.2 Perception and autonomy software | TPM-1, TPM-2, TPM-3, TPM-4, TPM-5, TPM-6, TPM-10, TPM-11, TPM-12 |
| SW.2.1 Sensor interface and robot model | TPM-4, TPM-5, TPM-6, TPM-11, TPM-12 |
| SW.2.2 Localization and mapping | TPM-1, TPM-2, TPM-3, TPM-4, TPM-5, TPM-6, TPM-11, TPM-12 |
| SW.2.3 Path planning and following | TPM-1, TPM-2, TPM-3, TPM-4, TPM-6, TPM-10, TPM-11 |
| SW.2.4 Task sequencer | TPM-1, TPM-2, TPM-3, TPM-6, TPM-11 |
| SW.3 Operator station software | TPM-1, TPM-3, TPM-6, TPM-8, TPM-11 |
| SW.3.1 Operator frontend | TPM-1, TPM-3, TPM-6, TPM-8 |
| SW.3.2 Teleop mapping | TPM-6, TPM-11 |
| SW.4 Bringup, link and logging | TPM-1, TPM-5, TPM-6, TPM-11, TPM-12 |
