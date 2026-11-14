# Open items

Everything in the docs that is not settled yet, in one place: each design doc's open
questions, then every marked passage. The markers are explained in
[Mark what is not settled](../writing-docs.md#mark-what-is-not-settled). Who works on
an item, and by when, is in Turgor; where a question has a Turgor deliverable, its
number is given.

To change an item, edit the doc or registry it comes from, then run
`scripts/design render`. This page is generated from the docs and `docs/design/*.toml`
by `scripts/design render`.

## Open questions

### [System Design](system.md#9-open-questions)

| Question | Turgor |
| --- | --- |
| 1. Which access point, robot radio, and network setup: NASA's cable in a LAN port, or Access Point mode with fixed addresses? | 5.7 |
| 2. Which dedicated IMU and cameras, and how does each connect to the Jetson? | 6.1 |
| 3. Which drive motor controllers? | 3.2 |
| 4. Which mechanism motor controllers? | 4.3 |
| 5. How do stand-ins swap in for hardware, system by system, and what are the launch arguments called? | 1.4 |
| 6. May the robot use 5 GHz during runs? The guidebook's §14.1.17 and §14.4 disagree (Rules the robot must follow). Ask the organizers. Asked through 5.7; [TBD: no answer yet as of 2026-11-04]. | 5.7 |
| 7. Does a mini PC replace the Jetson on the rover? The team's Hacker Initiative grant application budgets one, an ASRock 4X4 BOX-AI340 with 32 GB of memory, for its faster CPU and hardware video encoding, plus an isolated CANable 2.0 Pro clone. The Jetson would then run the bench testbed. [TBD: decided by the grant, announced by Dec 21, 2026.] If it does, this doc's Jetson references become the mini PC, and on its standard Ubuntu kernel the CANable needs no driver build (CAN bus). | 1.16 |
| 8. Should the robot's radio be the robot computer's own Wi-Fi? The computer runs on its own battery, so a main-battery sag in a stall could not drop the link, while a separate radio on the main battery reboots if the pack falls below its converter's 9 V minimum (operating modes, section 7). It must still meet the radio rules (Rules the robot must follow). | 5.7 |
| 9. Which node publishes wheel odometry, and on which topic? The drivetrain draft (PR #17) has one drivetrain_node that publishes joint states only; Turgor 3.3 and 3.5 plan ros2_control, whose diff drive controller publishes odometry. Localization (7.5) and the position error budget depend on it. | 3.1 |

### [Operating Modes Design](operating-modes.md#9-open-questions)

| Question | Turgor |
| --- | --- |
| 2. Does the robot drive while digging? A comment on the Spring 2026 power budget (cell M3) asks the same. If not, EXCAVATE allows no drive. [TBR: the software lead answered yes, at creep output, in the teleoperation review on 2026-10-23; for Mechanical to confirm.] | 4.1 |
| 3. Does the conveyor run during DUMP? [TBR: the software lead answered yes in the teleoperation review on 2026-10-23; for Mechanical to confirm.] | 4.1 |
| 4. Which sensors tell software that the excavator is stowed and the hatch is closed? The entry guards need them. For Mechanical and Electrical. | 4.1 |
| 5. Which motor controller runs each mechanism motor? Motors that need a current limit must be on a Talon SRX: the excavator's 775 RedLine (130 A stall, test report, p. 1) and the depth actuators (about 50 A stall, Pololu product page, section "Using the actuator"). For Electrical. | 4.3 |
| 6. Does one process's Phoenix enable keep another process's motor controllers enabled? This decides which node feeds the enable. With Phoenix 5 and Phoenix 6 in separate nodes (section 5), also check whether either library's enable reaches the other's controllers. Test on the bench. | 3.6 |
| 8. Ask the organizers: does energy used during the 10-minute setup count, and does a separate compute battery have to go through the energy logger? | None |
| 9. Should `link_timeout` be longer in AUTO, to ride through Wi-Fi dropouts? Measure dropouts in the pits first. | 5.6 |
| 10. Does anything deploy after the run starts (stowed envelope 150 × 75 × 75 cm, §13.3, p. 42)? If so, add a DEPLOY step. For Mechanical. | 4.1 |

### [Autonomy Subsystem Design](autonomy.md#9-open-questions)

| Question | Turgor |
| --- | --- |
| 1. I added an extra section for scoring, is that fine? | None |
| 2. Which LiDAR-inertial odometry package runs on the Unitree L2, and does it, with Nav2, fit the Jetson inside the TPM-11 budget? Until it is chosen, every rate and package marked with this question is a proposal. | 7.5 |
| 3. How are craters, which sit below the ground, found in the point cloud: cells below the local ground height by more than crater_min_depth, or cells the LiDAR cannot see? Test both on a recording of a dug hole. | 7.5 |
| 4. Find the start position and heading from the LiDAR alone, or add markers on the arena frame beside the starting zone? Markers are allowed there, but count toward the robot's mass (guidebook §13.7, p. 43). | 7.5 |
| 5. How does the task sequencer know the bin is full: a reading on /mechanism/status (motor current, a load cell, a level sensor) or a fixed dig time? For the mechanism doc. | 4.2 |
| 6. May the robot drive to the berm target's published position (guidebook §11.2, pp. 34-35), or does that count as prior knowledge of the arena, which §16.3 forbids for travel? Ask in the FAQ. If it may not, the robot must find the construction zone from what it sees. | None |

### `teleoperation.md`, not written yet (5.1)

| Question | Turgor |
| --- | --- |
| 3. What topics and message types carry movement commands, and which code selects TELEOP or AUTO commands? | None |
| 4. What final network settings and frontend delivery will be used: HTTPS and secure WebSockets served from the robot computer, or a packaged desktop app? | 5.7 |
| 5. What command and telemetry interfaces let teleop expose any combination of functions? The draft proposes one command topic per function that moves on its own (drive, coordinated depth raise and lower, excavator, conveyor, hatch) and one telemetry topic per source, not per motor or button. | None |

### [Testing Layers](testing-layers.md#open-questions)

| Question | Turgor |
| --- | --- |
| 1. Where do bench procedures, robot procedures, and test logs live: beside each package's code, or in one folder? The answer becomes a template. | 1.3 |
| 2. The launch arguments' names and values (1.4). These pages use `backend` for the whole robot and each system's name, such as `drivetrain`, for one system, with the values `stub`, `fake_motor_controllers`, `gazebo`, and `real`, as an example. | 1.4 |

## Marked in the registries

Values in the design registries that are not settled yet. They show in every table
that uses them; each is listed here once.

### `system.toml`

| Entry | Field | Value |
| --- | --- | --- |
| element SW.1.2 | function | Sends drive motor commands and per-mode current limits; computes wheel odometry [TBD: which node, system open question 9] |
| element SW.1.5 | function | Passes on drive and mechanism commands from the active control source, TELEOP or AUTO, and drops the other source's [TBR: proposed in the PDR; whether it is a node of its own, and which doc designs it, wait on teleop open question 3] |
| element SW.3.1 | connects_to | Gamepad (Xbox Model 1914, USB-C cable); operator laptop [TBR: an HTTPS page served by the robot, or a desktop app, teleoperation doc (5.1)] |
| node command_selection | package | [TBD: teleop open question 3] |
| interface /cmd_vel | type | geometry_msgs/msg/TwistStamped [TBR: the drivetrain draft (PR #17) uses Twist; Turgor 3.1 and 5.3 and the teleop draft use TwistStamped] |
| interface /cmd_vel | rate | 20 Hz [TBR: drivetrain draft, PR #17] |
| interface /cmd_vel | qos | best effort, depth 1 [TBR: drivetrain draft, PR #17] |
| interface mechanism-command | name | [TBD: mechanism command topic, teleop open question 3] |
| interface mechanism-command | type | [TBD: in the mechanism doc (4.2)] |
| interface mechanism-command | rate | [TBD: in the mechanism doc (4.2)] |
| interface mechanism-command | qos | [TBD: in the mechanism doc (4.2)] |

### `operating-modes.toml`

| Entry | Field | Value |
| --- | --- | --- |
| node mode_manager | package | `luna_modes` [TBR: proposed name] |
| node power_panel | package | [TBD: operating modes v1 (1.19)] |

### `autonomy.toml`

| Entry | Field | Value |
| --- | --- | --- |
| node localization | package | `luna_autonomy` [TBR: autonomy open question 2] |
| node planner | package | `luna_autonomy`, with Nav2 [TBR: autonomy open question 2] |
| interface robot-pose | rate | 50 Hz [TBR: autonomy open question 2] |
| interface obstacle-map | rate | `map_publish_rate`, 2 Hz [TBR: autonomy open question 2] |
| interface auto-drive-command | name | /auto/cmd_vel [TBR: teleop open question 3] |
| interface auto-drive-command | type | geometry_msgs/msg/TwistStamped [TBR: matches /teleop/cmd_vel] |
| interface navigate | type | nav2_msgs/action/NavigateToPose [TBR: autonomy open question 2] |
| interface auto-mechanism-command | name | [TBD: AUTO mechanism command topics, teleop open questions 3 and 5] |
| interface auto-mechanism-command | type | [TBD: mechanism doc (4.2)] |
| interface auto-mechanism-command | rate | 20 Hz [TBR: matches teleop's command_rate] |
| interface auto-mechanism-command | qos | [TBD: mechanism doc (4.2)] |
| interface autonomy-status | type | luna_interfaces/msg/AutonomyStatus [TBR: proposed in section 3] |

### `drivetrain.toml`

| Entry | Field | Value |
| --- | --- | --- |
| node drivetrain | does | Drives only when the mode allows it, within the mode's current limits [TBD: one drivetrain_node, or ros2_control's controller manager with a diff drive controller, drivetrain doc (3.1)] |
| interface /drivetrain/joint_states | rate | 50 Hz [TBR: drivetrain draft, PR #17] |
| interface /drivetrain/joint_states | qos | sensor data: best effort, depth 5 [TBR: drivetrain draft, PR #17] |
| interface wheel-odometry | name | [TBD: wheel odometry topic, system open question 9] |
| interface wheel-odometry | type | nav_msgs/msg/Odometry [TBR: system open question 9] |
| interface wheel-odometry | rate | [TBD: drivetrain doc (3.1)] |
| interface wheel-odometry | qos | [TBD: drivetrain doc (3.1)] |

### `mechanism.toml`

| Entry | Field | Value |
| --- | --- | --- |
| interface /mechanism/status | type | [TBD: mechanism doc (4.2)] |
| interface /mechanism/status | rate | [TBD: mechanism doc (4.2)] |
| interface /mechanism/status | qos | [TBD: mechanism doc (4.2)] |

### `performance-budgets.toml`

| Entry | Field | Value |
| --- | --- | --- |
| TPM-2 | threshold | ≤7.0 [TBR: proposed in the PDR (1.6)] |
| TPM-2 | goal | ≤6.0 [TBR: proposed in the PDR (1.6)] |
| TPM-2 | row "Excavate until the bin is full": basis | [TBR: dig rate and bin volume, with Mechanical (4.1)] |
| TPM-2 | row "Travel loaded across the obstacle zone (4.38 m long)": basis | [TBR: proposed in the PDR (1.6)] |
| TPM-2 | row "Dump": basis | [TBR: with Mechanical (4.1)] |
| TPM-2 | row "Travel empty back": basis | [TBR: proposed in the PDR (1.6)] |
| TPM-2 | row "Task-mode switches (4 per cycle)": basis | [TBR: proposed in the PDR (1.6)] |
| TPM-3 | goal | ≤60 [TBR: proposed in the PDR (1.6)] |
| TPM-3 | row "Find position and heading from the random start": value | 0, since it is done during the 10-minute setup while the robot sits still (≤60 s of setup time) [TBR: proposed in the PDR (1.6)] |
| TPM-4 | threshold | ≤1 [TBR: proposed in the PDR (1.6)] |
| TPM-4 | row "Map cell size": value | 5 [TBR: proposed in the PDR (1.6)] |
| TPM-4 | row "Path-following error": value | 10 [TBR: proposed in the PDR (1.6)] |
| TPM-4 | row "Error in the robot's outline in the robot model": value | 2 [TBR: proposed in the PDR (1.6)] |
| TPM-4 | row "Detection range": value | ≥2.0 [TBR: proposed in the PDR (1.6)] |
| TPM-5 | threshold | ≤0.20 [TBR: proposed in the PDR (1.6)] |
| TPM-5 | goal | ≤0.10 [TBR: proposed in the PDR (1.6)] |
| TPM-5 | row "Wheel odometry error around a 2 m square": value | [TBD: measured in 3.9 (Gazebo) and 3.7 (robot); it needs drive encoders, which 6.1 has not confirmed] |
| TPM-5 | row "IMU heading drift": value | [TBD: sensor suite evaluation (6.1)] |
| TPM-5 | row "Sensor position error in the robot model": value | ≤0.01, from CAD [TBR: proposed in the PDR (1.6)] |
| TPM-5 | row "Sensor timestamp mismatch": value | ≤10 [TBR: proposed in the PDR (1.6)] |
| TPM-6 | goal | ≤1,000, which scores 90 of 120 [TBR: proposed in the PDR (1.6)] |
| TPM-6 | note | **Over rosbridge, each sender's number includes its encoding** (JSON, or CBOR for the camera) [TBR: measured in 5.6]. |
| TPM-6 | row "Drivetrain data [TBR: drivetrain doc (3.1)]": part | Drivetrain data [TBR: drivetrain doc (3.1)] |
| TPM-6 | row "Stowed and hatch status [TBD: mechanism doc (4.2)]": part | Stowed and hatch status [TBD: mechanism doc (4.2)] |
| TPM-6 | row "rosbridge connection overhead (WebSocket over TCP) [TBR: measured in 5.6]": part | rosbridge connection overhead (WebSocket over TCP) [TBR: measured in 5.6] |
| TPM-8 | note | **SW.3.2 drops gamepad input older than `input_timeout`** (0.15 s) [TBR: teleoperation doc (5.1)]. |
| TPM-8 | note | **Stale input:** [TBD: how SW.3.2 tells stale input from fresh, since the laptop's and the robot's clocks differ, teleoperation doc (5.1)]. |
| TPM-8 | row "Declare the link lost": value | 500 after the last heartbeat (`link_timeout`) [TBR: operating modes open question 9] |
| TPM-9 | threshold | Below the main breaker rating, 150 A in operating modes [TBR: Electrical's power budget workbook sizes it at 170 to 175 A] |
| TPM-9 | note | **The limits come from operating modes** [TBR: for Electrical to confirm]. |
| TPM-9 | note | **Victor SPX followers can't limit current.** The 15 A per drive motor holds only if each follower draws like its Talon leader [TBR: drivetrain doc (3.1)]. The Talon FXS controllers the team plans to buy can limit current [TBR: the grant (1.16)]. |
| TPM-9 | row "Electronics on the main battery": value | [TBR: Electrical's power budget workbook], not counted |
| TPM-10 | threshold | A baseline [TBD: measured on the first full robot cycle] |
| TPM-10 | row "Excavate": value | [TBD: baseline] |
| TPM-10 | row "Travel, loaded and empty": value | [TBD: baseline] |
| TPM-10 | row "Dump": value | [TBD: baseline] |
| TPM-10 | row "Electronics on the main battery over the cycle (LiDAR, radio, controllers)": value | [TBD: baseline] |
| TPM-11 | threshold | ≤85 [TBR: proposed in the PDR (1.6)] |
| TPM-11 | goal | ≤70 [TBR: proposed in the PDR (1.6)] |
| TPM-11 | row "Localization and mapping": value | [TBD: autonomy doc v1 (7.8)]; expected to be the largest share |
| TPM-11 | row "Path planning and following": value | [TBD: autonomy doc v1 (7.8)] |
| TPM-11 | row "Sensor drivers, including camera compression": value | [TBD: autonomy doc v1 (7.8)] |
| TPM-11 | row "Task sequencer": value | [TBD: autonomy doc v1 (7.8)] |
| TPM-11 | row "Robot control": value | [TBD: autonomy doc v1 (7.8)] |
| TPM-11 | row "Teleop mapping": value | [TBD: autonomy doc v1 (7.8)]; expected to be small |
| TPM-11 | row "Bringup, link (rosbridge), and logging": value | [TBD: autonomy doc v1 (7.8)] |
| TPM-12 | threshold | ≤180 [TBR: proposed in the PDR (1.6)] |
| TPM-12 | goal | ≤120 [TBR: proposed in the PDR (1.6)] |
| TPM-12 | row "Operating system boots": value | [TBD: measured in 2.10] |
| TPM-12 | row "Every robot program starts": value | [TBD: measured in 2.10] |
| TPM-12 | row "Self-test finds every CAN device": value | ≤10, with FAULT at 60 [TBR: proposed in the PDR (1.6)] |
| TPM-12 | row "Sensor drivers publishing": value | [TBD: sensors doc (6.2)] |

### `sensors.toml`

| Entry | Field | Value |
| --- | --- | --- |
| node imu_driver | package | [TBD: the IMU, sensor suite evaluation (6.1)] |
| node camera_driver | package | [TBD: the cameras, sensor suite evaluation (6.1)] |
| interface unilidar/cloud | rate | [TBD: sensors doc (6.2)] |
| interface unilidar/cloud | qos | [TBD: sensors doc (6.2)] |
| interface unilidar/imu | rate | [TBD: sensors doc (6.2)] |
| interface unilidar/imu | qos | [TBD: sensors doc (6.2)] |
| interface imu/data_raw | rate | [TBD: sensors doc (6.2)] |
| interface imu/data_raw | qos | [TBD: sensors doc (6.2)] |
| interface camera-image | name | [TBD: camera image topics, sensors doc (6.2)] |
| interface camera-image | type | sensor_msgs/msg/CompressedImage [TBR: sensors doc (6.2)] |
| interface camera-image | rate | [TBD: sensors doc (6.2)] |
| interface camera-image | qos | [TBD: sensors doc (6.2)] |

### `teleoperation.toml`

| Entry | Field | Value |
| --- | --- | --- |
| node operator_frontend | package | Custom frontend with `roslibjs` [TBR: teleop draft, PR #14] |
| node teleop_node | package | `luna_teleop` [TBR: teleop draft, PR #14] |
| interface /joy | rate | `autorepeat_rate`, 20 Hz, and on change [TBR: teleop draft, PR #14] |
| interface /joy | qos | [TBD: as rosbridge publishes it, teleoperation doc (5.1)] |
| interface /teleop/cmd_vel | type | geometry_msgs/msg/TwistStamped [TBR: teleop draft, PR #14] |
| interface /teleop/cmd_vel | rate | `command_rate`, 20 Hz [TBR: teleop draft, PR #14] |
| interface /teleop/cmd_vel | qos | best effort, volatile, depth 1 [TBR: teleop draft, PR #14] |
| interface /teleop/cmd_vel | note | The name comes from the teleop draft (PR #14) [TBR: teleop open question 3, which decides how TELEOP and AUTO commands reach the drivetrain]. |
| interface teleop-mechanism-command | name | [TBD: teleop's mechanism command topics, teleop open questions 3 and 5] |
| interface teleop-mechanism-command | type | [TBD: mechanism doc (4.2)] |
| interface teleop-mechanism-command | rate | `command_rate`, 20 Hz [TBR: teleop draft, PR #14, for the mechanism doc (4.2) to confirm] |
| interface teleop-mechanism-command | qos | [TBD: teleoperation doc (5.1)] |

## Marked in the test sheet

Every `[TBD]` and `[TBR]` in the end-to-end test procedures, which live in the
[test sheet](end-to-end-tests.md). This page reads the sheet each time it opens.

<!-- test-sheet: open-items -->

## Marked in the docs

Every `[TBD]` and `[TBR]` in the docs' own text, by page and section.

### [System Design](system.md)

| Section | Marked |
| --- | --- |
| [Hardware lines](system.md#hardware-lines) | [TBD: the limit switch and stowed signals, which the mechanism doc defines (4.2)] |
| [Hardware lines](system.md#hardware-lines) | [TBD: the image and camera info topics and frames of the cameras chosen in 6.1] |
| [Hardware lines](system.md#hardware-lines) | [TBR: chosen in the PR #14 review, 2026-10-26] |
| [Hardware lines](system.md#hardware-lines) | [TBD: the button and stick numbers from the gamepad's table (5.2)] |
| [Hardware lines](system.md#hardware-lines) | [TBR: chosen in the PR #14 review, 2026-10-26] |
| [The two IMUs](system.md#the-two-imus) | [TBD: the sensor suite evaluation (6.1) picks it] |
| [4. Parameters](system.md#4-parameters) | [TBD: named in deliverable 1.4, by Oct 21] |
| [4. Parameters](system.md#4-parameters) | [TBD: written with the node graph, by Oct 28] |
| [5. Libraries and hardware interfaces](system.md#5-libraries-and-hardware-interfaces) | [TBD: the controllers, in 3.2 (drive) and 4.3 (mechanism)] |
| [5. Libraries and hardware interfaces](system.md#5-libraries-and-hardware-interfaces) | [TBD: the robot's link, in the sensors doc (6.2)] |
| [5. Libraries and hardware interfaces](system.md#5-libraries-and-hardware-interfaces) | [TBD: ] |
| [5. Libraries and hardware interfaces](system.md#5-libraries-and-hardware-interfaces) | [TBD: the parts, in 5.7] |
| [How the operator station reaches the robot](system.md#how-the-operator-station-reaches-the-robot) | [TBD: either NASA's cable goes into one of its LAN ports, or the Beryl AX runs in Access Point mode and every device gets a fixed address; 5.7 decides] |
| [How the operator station reaches the robot](system.md#how-the-operator-station-reaches-the-robot) | [TBR: With rosbridge (PR #14 review, 2026-10-26), only the laptop's WebSocket connection has to reach the robot; ROS 2 discovery stays on the robot.] |
| [7. Behavior on failure](system.md#7-behavior-on-failure) | [TBD: defined in the sensors doc (6.2)] |
| [7. Behavior on failure](system.md#7-behavior-on-failure) | [TBD: defined in the sensors doc (6.2)] |

### [Operating Modes Design](operating-modes.md)

| Section | Marked |
| --- | --- |
| [Task modes (software, only while ENABLED)](operating-modes.md#task-modes-software-only-while-enabled) | [TBR: every value in the Entry guard, proposed for mechanical to confirm column] |
| [What is on in each mode](operating-modes.md#what-is-on-in-each-mode) | [TBD: open question 3] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: These are starting values for the electrical lead to confirm] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: every value in the TRAVEL column] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: every value in the EXCAVATE column] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: every value in the DUMP column] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: every value in the SERVICE column] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: Talon SRX leader, Victor SPX follower (3.2)] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: Talon SRX, open question 5] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBR: Talon SRX, open question 5] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBD: open question 5] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBD: open question 3] |
| [Current limits per mode](operating-modes.md#current-limits-per-mode) | [TBD: open question 5] |
| [2. Nodes](operating-modes.md#2-nodes) | [TBD: A mini PC replaces it on the rover if the Hacker Initiative grant pays for one; the Jetson then runs the bench testbed (system design, open question 7).] |
| [What runs in each mode](operating-modes.md#what-runs-in-each-mode) | [TBR: chosen in the PR #14 review, 2026-10-26; the teleoperation doc (5.1) holds the details] |
| [3. Interfaces](operating-modes.md#3-interfaces) | [TBR: Proposed] |
| [3. Interfaces](operating-modes.md#3-interfaces) | [TBR: Proposed] |
| [3. Interfaces](operating-modes.md#3-interfaces) | [TBR: Proposed] |
| [5. Libraries and hardware interfaces](operating-modes.md#5-libraries-and-hardware-interfaces) | [TBR: reported by other teams, not tried on our bus] |
| [5. Libraries and hardware interfaces](operating-modes.md#5-libraries-and-hardware-interfaces) | [TBR: the point, for the electrical lead] |
| [5. Libraries and hardware interfaces](operating-modes.md#5-libraries-and-hardware-interfaces) | [TBR: Once the grant's Mean Well RSD-30G converters replace the VRM, their output ground is tied to the computer's ground. They isolate input from output (RSD-30 datasheet, p. 2), so the sensors then share the computer's ground with no second path to the main battery's. The VRM's output must not be tied to it, since that would join the two grounds a second time.] |

### [Autonomy Subsystem Design](autonomy.md)

| Section | Marked |
| --- | --- |
| [2. Nodes](autonomy.md#2-nodes) | [TBR: autonomy open question 2] |
| [3. Interfaces](autonomy.md#3-interfaces) | [TBR: Proposed] |
| [4. Parameters](autonomy.md#4-parameters) | [TBR: tested in 7.5 and 7.6] |
| [4. Parameters](autonomy.md#4-parameters) | [TBD: drivetrain doc (3.1)] |
| [5. Libraries and hardware interfaces](autonomy.md#5-libraries-and-hardware-interfaces) | [TBD: chosen in 7.5, autonomy open question 2] |
| [5. Libraries and hardware interfaces](autonomy.md#5-libraries-and-hardware-interfaces) | [TBR: autonomy open question 2] |
| [5. Libraries and hardware interfaces](autonomy.md#5-libraries-and-hardware-interfaces) | [TBR: autonomy open question 2] |

### [Hardware Test Modes](hardware-test-modes.md)

| Section | Marked |
| --- | --- |
| [How to read the diagrams](hardware-test-modes.md#how-to-read-the-diagrams) | [TBD: The launch arguments are an example; deliverable 1.4 names the real ones by Oct 21.] |
| [How to read the diagrams](hardware-test-modes.md#how-to-read-the-diagrams) | [TBR: The drivetrain diagrams assume the drive controller decision (3.2) keeps the 2 Talon SRX and 2 Victor SPX.] |
| [How to read the diagrams](hardware-test-modes.md#how-to-read-the-diagrams) | [TBD: decided in 4.3] |
| [Drivetrain: Stub (Sim)](hardware-test-modes.md#drivetrain-stub-sim) | [TBD: `drivetrain:=stub`] |
| [Drivetrain: Fake motor controllers (Sim)](hardware-test-modes.md#drivetrain-fake-motor-controllers-sim) | [TBD: `drivetrain:=fake_motor_controllers`] |
| [Drivetrain: Gazebo (Sim)](hardware-test-modes.md#drivetrain-gazebo-sim) | [TBD: `drivetrain:=gazebo`] |
| [Drivetrain: Bench](hardware-test-modes.md#drivetrain-bench) | [TBD: `drivetrain:=real`] |
| [Drivetrain: Drive base (Robot)](hardware-test-modes.md#drivetrain-drive-base-robot) | [TBD: `drivetrain:=real`] |
| [Mechanism: Stub (Sim)](hardware-test-modes.md#mechanism-stub-sim) | [TBD: `mechanism:=stub`] |
| [Mechanism: Fake motor controllers (Sim)](hardware-test-modes.md#mechanism-fake-motor-controllers-sim) | [TBD: `mechanism:=fake_motor_controllers`] |
| [Mechanism: Bench](hardware-test-modes.md#mechanism-bench) | [TBD: `mechanism:=real`] |
| [Battery and power: Fake power panel (Sim)](hardware-test-modes.md#battery-and-power-fake-power-panel-sim) | [TBR: The fake sends frames on a virtual CAN bus, so this mode works wherever the panel reading lives. The panel reading needs no Phoenix 5, so it may leave the drive plugin and deliverable 3.5.] |
| [Battery and power: Drive base (Robot)](hardware-test-modes.md#battery-and-power-drive-base-robot) | [TBR: reported by other teams, cause not found] |
| [LiDAR: Stub (Sim)](hardware-test-modes.md#lidar-stub-sim) | [TBD: `lidar:=stub`] |
| [LiDAR: Gazebo (Sim)](hardware-test-modes.md#lidar-gazebo-sim) | [TBD: `lidar:=gazebo`] |
| [LiDAR: Bench](hardware-test-modes.md#lidar-bench) | [TBD: `lidar:=real`] |
| [Dedicated IMU: Stub (Sim)](hardware-test-modes.md#dedicated-imu-stub-sim) | [TBD: `imu:=stub`] |
| [Dedicated IMU: Gazebo (Sim)](hardware-test-modes.md#dedicated-imu-gazebo-sim) | [TBD: `imu:=gazebo`] |
| [Dedicated IMU: Bench](hardware-test-modes.md#dedicated-imu-bench) | [TBD: `imu:=real`] |
| [Cameras: Stub (Sim)](hardware-test-modes.md#cameras-stub-sim) | [TBD: `cameras:=stub`] |
| [Cameras: Gazebo (Sim)](hardware-test-modes.md#cameras-gazebo-sim) | [TBD: `cameras:=gazebo`] |
| [Cameras: Bench](hardware-test-modes.md#cameras-bench) | [TBD: `cameras:=real`] |
| [Radio link](hardware-test-modes.md#radio-link) | [TBR: chosen in the PR #14 review, 2026-10-26] |

### [Testing Layers](testing-layers.md)

| Section | Marked |
| --- | --- |
| [The layers](testing-layers.md#the-layers) | [TBR: a current-limited supply, the E-stop in reach, the device clamped, and two people present] |
| [Stand-ins](testing-layers.md#stand-ins) | [TBR: on a virtual CAN bus] |
| [Choosing stand-ins per system](testing-layers.md#choosing-stand-ins-per-system) | [TBD: chosen in deliverable 1.4] |

### [Building for the robot](../building-for-the-robot.md)

| Section | Marked |
| --- | --- |
| [Building for the robot](../building-for-the-robot.md#building-for-the-robot) | [TBD: still being decided: the platform workstream chooses one in deliverables 2.9 (Jetson bring-up) and 2.10 (robot deployment) and records it in the platform design doc] |

### [CAN bus](../can-bus.md)

| Section | Marked |
| --- | --- |
| [What you need](../can-bus.md#what-you-need) | [TBR: read from the kernel configurations NVIDIA ships for JetPack 5 and 6, not yet checked on our Jetson] |
| [What you need](../can-bus.md#what-you-need) | [TBR: The script has not been run on a Jetson yet, and whether DKMS rebuilds the driver by itself after a JetPack kernel update is not known.] |
| [The power distribution panel](../can-bus.md#the-power-distribution-panel) | [TBR: worked out from the driver's frame numbers, not seen on our bus yet] |
| [The Phoenix libraries](../can-bus.md#the-phoenix-libraries) | [TBR: reported by other teams, not tried on our bus] |

### [Rules the robot must follow](../competition/robot-rules.md)

| Section | Marked |
| --- | --- |
| [Communications](../competition/robot-rules.md#communications) | [TBD: The guidebook also says teams "can elect to use 5 GHz Wi-Fi during competition for WAP to robot communications", which NASA does not monitor for interference (§14.1.17, p. 48), but channel 1 is a 2.4 GHz channel and section 14.4 says robot operations happen only on it. Ask in the FAQ before designing the link around 5 GHz.] |

### [Development environment](../development-environment.md)

| Section | Marked |
| --- | --- |
| [What works where](../development-environment.md#what-works-where) | [TBR: yes, not tested yet] |
| [What works where](../development-environment.md#what-works-where) | [TBR: VNC desktop through an editor, not tested yet] |
| [What works where](../development-environment.md#what-works-where) | [TBD: not tested] |
| [What works where](../development-environment.md#what-works-where) | [TBD: not set up yet (deliverable 5.2)] |
| [What works where](../development-environment.md#what-works-where) | [TBD: not set up yet] |
| [What works where](../development-environment.md#what-works-where) | [TBR: yes, with ROS's `joy` package; not tested yet] |

<!-- test-sheet: data -->
