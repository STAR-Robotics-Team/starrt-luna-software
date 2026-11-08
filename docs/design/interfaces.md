# Interfaces

Every node and every topic, service, and action in the robot software, as the design
docs' registries define them. Each one is defined in exactly one design doc's registry,
beside the node that publishes or serves it, and that doc owns it. To change one, edit
that registry and run `scripts/design render`; see
[Registries](README.md#registries). The [system design](system.md#2-nodes) draws them
as a graph.

This page is generated from `docs/design/*.toml` by `scripts/design render`.

## Nodes

| Node | Element | Runs on | Design doc | What it does |
| --- | --- | --- | --- | --- |
| Command selection node | SW.1.5 Command selection | Robot computer | [System Design](system.md) | Passes on the drive and mechanism commands of the active control source, as /robot/mode names it, and drops the other source's |
| `mode_manager` | SW.1.1 Mode manager | Robot computer | [Operating Modes Design](operating-modes.md) | Owns the robot state and task mode, runs the boot self-test, watches the heartbeat, faults, and battery, and accepts or refuses mode requests |
| Power panel reading node | SW.1.4 Power telemetry | Robot computer | [Operating Modes Design](operating-modes.md) | Decodes the PDP's CAN frames from can0 (section 5) and publishes the battery voltage, each channel's current, and the energy used. It is a node of its own, since reading the PDP needs no Phoenix library. |
| Localization and mapping | SW.2.2 Localization and mapping | Robot computer | [Autonomy Subsystem Design](autonomy.md) | Finds the robot's position and heading from the random start, and builds the obstacle map, from the LiDAR, the IMUs, and the wheels |
| Path planning and following | SW.2.3 Path planning and following | Robot computer | [Autonomy Subsystem Design](autonomy.md) | Plans a path around the mapped obstacles to the goal the task sequencer sends, follows it in AUTO, and stops when the robot leaves AUTO or loses its position |
| Task sequencer | SW.2.4 Task sequencer | Robot computer | [Autonomy Subsystem Design](autonomy.md) | Runs dig, travel, dump, travel in AUTO: changes the task mode and sends mechanism commands, but can never enable the robot |
| Drivetrain node | SW.1.2 Drivetrain control | Robot computer | `drivetrain.md`, not written yet (3.1) | Drives only when the mode allows it, within the mode's current limits [TBD: one drivetrain_node, or ros2_control's controller manager with a diff drive controller, drivetrain doc (3.1)] |
| Mechanism node | SW.1.3 Mechanism control | Robot computer | `mechanism.md`, not written yet (4.2) | Runs each mechanism actuator only when the mode allows it, within the mode's limits, and reports whether the excavator is stowed and the hatch is closed |
| `rosbridge_websocket` | SW.4 Bringup, link and logging | Robot computer | `platform.md`, not written yet (2.11) | Carries the operator frontend's topics and service calls over one WebSocket connection; what crosses the radio link is set here (PR #14 review, 2026-10-26) |
| `ros2 bag` recorder | SW.4 Bringup, link and logging | Robot computer | `platform.md`, not written yet (2.11) | Records every run |
| Unitree L2 driver | SW.2.1 Sensor interface and robot model | Robot computer | `sensors.md`, not written yet (6.2) | Publishes the L2's point cloud and its built-in IMU, with Unitree's default names and frames |
| Dedicated IMU driver | SW.2.1 Sensor interface and robot model | Robot computer | `sensors.md`, not written yet (6.2) | Publishes the dedicated IMU's gyroscope and accelerometer in one message, with no magnetometer (system design R5) |
| Camera driver | SW.2.1 Sensor interface and robot model | Robot computer | `sensors.md`, not written yet (6.2) | Publishes the driving camera's compressed images for the operator view |
| Operator frontend | SW.3.1 Operator frontend | Operator laptop, in a browser, through rosbridge | `teleoperation.md`, not written yet (5.1) | Reads the gamepad through the browser's Gamepad API, sends /joy, the heartbeat, and mode requests through rosbridge, and shows each control source's default view, which the operator can change, with live link bandwidth. It is not a ROS node: rosbridge publishes and calls for it. |
| `teleop_node` | SW.3.2 Teleop mapping | Robot computer | `teleoperation.md`, not written yet (5.1) | Turns fresh /joy input into drive and mechanism commands, zeroes them when the hold button is released, drops stale input, and requests DISABLED when the controller's input is lost |

## Topics, services, and actions

| Name | Kind | Type | Rate | Publisher or server | Subscriber or client | QoS | Defined in |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/cmd_vel` | topic | geometry_msgs/msg/TwistStamped [TBR: the drivetrain draft (PR #17) uses Twist; Turgor 3.1 and 5.3 and the teleop draft use TwistStamped] | 20 Hz [TBR: drivetrain draft, PR #17] | Command selection node | Drivetrain node | best effort, depth 1 [TBR: drivetrain draft, PR #17] | [System Design](system.md) |
| [TBD: mechanism command topic, teleop open question 3] | topic | [TBD: in the mechanism doc (4.2)] | [TBD: in the mechanism doc (4.2)] | Command selection node | Mechanism node | [TBD: in the mechanism doc (4.2)] | [System Design](system.md) |
| `/diagnostics` | topic | `diagnostic_msgs/msg/DiagnosticArray` | 1 Hz and on change | Drivetrain node, Mechanism node, Camera driver, Dedicated IMU driver, Localization and mapping, Path planning and following, Task sequencer | `mode_manager` | reliable, depth 10 | [System Design](system.md) |
| `/robot/mode` | topic | `luna_interfaces/msg/RobotMode` | 10 Hz and on change | `mode_manager` | Drivetrain node, Mechanism node, Command selection node, Path planning and following, Task sequencer, Operator frontend, `teleop_node` | reliable, transient local, depth 1 | [Operating Modes Design](operating-modes.md) |
| `/robot/request_mode` | service | `luna_interfaces/srv/RequestMode` | On demand | `mode_manager` | Operator frontend, `teleop_node` | default | [Operating Modes Design](operating-modes.md) |
| `/robot/request_task` | service | `luna_interfaces/srv/RequestTask` | On demand | `mode_manager` | Task sequencer | default | [Operating Modes Design](operating-modes.md) |
| `/power/battery` | topic | `sensor_msgs/msg/BatteryState` | 10 Hz | Power panel reading node | `mode_manager`, Operator frontend | best effort, depth 1 | [Operating Modes Design](operating-modes.md) |
| `/autonomy/odometry` | topic | `nav_msgs/msg/Odometry` | 50 Hz [TBR: autonomy open question 2] | Localization and mapping | Path planning and following, Task sequencer | best effort, volatile, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/obstacle_map` | topic | `nav_msgs/msg/OccupancyGrid` | `map_publish_rate`, 2 Hz [TBR: autonomy open question 2] | Localization and mapping | Path planning and following, Operator frontend | reliable, transient local, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/plan` | topic | `nav_msgs/msg/Path` | On each replan, at most 1 Hz | Path planning and following | Operator frontend | reliable, volatile, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| /auto/cmd_vel [TBR: teleop open question 3] | topic | geometry_msgs/msg/TwistStamped [TBR: matches /teleop/cmd_vel] | `command_rate`, 20 Hz | Path planning and following | Command selection node | best effort, volatile, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/navigate` | action | nav2_msgs/action/NavigateToPose [TBR: autonomy open question 2] | On demand | Path planning and following | Task sequencer | default | [Autonomy Subsystem Design](autonomy.md) |
| [TBD: AUTO mechanism command topics, teleop open questions 3 and 5] | topic | [TBD: mechanism doc (4.2)] | 20 Hz [TBR: matches teleop's command_rate] | Task sequencer | Command selection node | [TBD: mechanism doc (4.2)] | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/status` | topic | luna_interfaces/msg/AutonomyStatus [TBR: proposed in section 3] | 1 Hz and on change | Task sequencer | None yet | reliable, transient local, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/drivetrain/joint_states` | topic | `sensor_msgs/msg/JointState` | 50 Hz [TBR: drivetrain draft, PR #17] | Drivetrain node | Localization and mapping | sensor data: best effort, depth 5 [TBR: drivetrain draft, PR #17] | `drivetrain.md`, not written yet (3.1) |
| [TBD: wheel odometry topic, system open question 9] | topic | nav_msgs/msg/Odometry [TBR: system open question 9] | [TBD: drivetrain doc (3.1)] | Drivetrain node | Localization and mapping | [TBD: drivetrain doc (3.1)] | `drivetrain.md`, not written yet (3.1) |
| `/mechanism/status` | topic | [TBD: mechanism doc (4.2)] | [TBD: mechanism doc (4.2)] | Mechanism node | `mode_manager`, Task sequencer, Operator frontend | [TBD: mechanism doc (4.2)] | `mechanism.md`, not written yet (4.2) |
| `unilidar/cloud` | topic | `sensor_msgs/msg/PointCloud2` | [TBD: sensors doc (6.2)] | Unitree L2 driver | Localization and mapping | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| `unilidar/imu` | topic | `sensor_msgs/msg/Imu` | [TBD: sensors doc (6.2)] | Unitree L2 driver | Localization and mapping | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| `imu/data_raw` | topic | `sensor_msgs/msg/Imu` | [TBD: sensors doc (6.2)] | Dedicated IMU driver | Localization and mapping | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| [TBD: camera image topics, sensors doc (6.2)] | topic | sensor_msgs/msg/CompressedImage [TBR: sensors doc (6.2)] | [TBD: sensors doc (6.2)] | Camera driver | Operator frontend | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| `/joy` | topic | `sensor_msgs/msg/Joy` | `autorepeat_rate`, 20 Hz, and on change [TBR: teleop draft, PR #14] | Operator frontend | `teleop_node` | [TBD: as rosbridge publishes it, teleoperation doc (5.1)] | `teleoperation.md`, not written yet (5.1) |
| `/operator/heartbeat` | topic | `std_msgs/msg/Header` | `heartbeat_rate`, 10 Hz, including in AUTO and with the hold button released | Operator frontend | `mode_manager` | best effort, depth 1 | `teleoperation.md`, not written yet (5.1) |
| `/teleop/cmd_vel` | topic | geometry_msgs/msg/TwistStamped [TBR: teleop draft, PR #14] | `command_rate`, 20 Hz [TBR: teleop draft, PR #14] | `teleop_node` | Command selection node | best effort, volatile, depth 1 [TBR: teleop draft, PR #14] | `teleoperation.md`, not written yet (5.1) |
| [TBD: teleop's mechanism command topics, teleop open questions 3 and 5] | topic | [TBD: mechanism doc (4.2)] | `command_rate`, 20 Hz [TBR: teleop draft, PR #14, for the mechanism doc (4.2) to confirm] | `teleop_node` | Command selection node | [TBD: teleoperation doc (5.1)] | `teleoperation.md`, not written yet (5.1) |

### Notes

- `/diagnostics`: Every node of ours that can fail reports here; an ERROR puts the robot in FAULT (operating modes, section 7).
- `/autonomy/odometry`: The fused position, heading, and velocity in the map frame. The same estimate is published as the map to odom to base_link transforms.
- `/autonomy/obstacle_map`: 5 cm cells (TPM-4). Rocks and craters are both marked occupied. The operator frontend receives it at no more than 1 Hz, to stay inside its TPM-6 budget of 150 kbit/s in AUTO.
- /auto/cmd_vel [TBR: teleop open question 3]: Matches /teleop/cmd_vel, so the command selection node treats both sources the same.
- `/autonomy/navigate`: The task sequencer sends one goal per travel leg: a dig spot or a dump spot.
- `/autonomy/status`: The cycle step, the cycle count, and why the sequencer stopped, for the operator display, so the operator can tell the Mission Control Judge when an autonomous attempt starts and ends.
- `unilidar/cloud`: In frame unilidar_lidar, as Unitree's launch file names it (system design, Hardware lines).
- `unilidar/imu`: In frame unilidar_imu, fixed to the LiDAR (system design, The two IMUs).
- `imu/data_raw`: The main IMU, near the center of mass, following REP 145's names (system design, The two IMUs).
- `/teleop/cmd_vel`: The name comes from the teleop draft (PR #14) [TBR: teleop open question 3, which decides how TELEOP and AUTO commands reach the drivetrain].
- [TBD: teleop's mechanism command topics, teleop open questions 3 and 5]: Teleop open question 5 proposes one command topic per function that moves on its own: drive, coordinated depth raise and lower, excavator, conveyor, and hatch.
