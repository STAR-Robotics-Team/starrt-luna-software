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
| `command_selector` | SW.1.5 Command selection | Robot computer | [System Design](system.md) | Forwards, unchanged, the drive and mechanism commands of the control source /robot/mode names, and drops the other source's. It never falls back to the other source, forwards nothing unless the robot is ENABLED, and sends one zero command on each output when the source changes. |
| `mode_manager` | SW.1.1 Mode manager | Robot computer | [Operating Modes Design](operating-modes.md) | Owns the robot state and task mode, runs the boot self-test, watches the heartbeat, faults, and battery, and accepts or refuses mode requests |
| Power panel reading node | SW.1.4 Power telemetry | Robot computer | [Operating Modes Design](operating-modes.md) | Decodes the PDP's CAN frames from can0 (section 5) and publishes the battery voltage, each channel's current, and the energy used. It is a node of its own, since reading the PDP needs no Phoenix library. |
| Localization and mapping | SW.2.2 Localization and mapping | Robot computer | [Autonomy Subsystem Design](autonomy.md) | Finds the robot's position and heading from the random start, and builds the obstacle map, from the LiDAR, the IMUs, and the wheels |
| Path planning and following | SW.2.3 Path planning and following | Robot computer | [Autonomy Subsystem Design](autonomy.md) | Plans a path around the mapped obstacles to the goal the task sequencer sends, follows it in AUTO, and stops when the robot leaves AUTO or loses its position |
| Task sequencer | SW.2.4 Task sequencer | Robot computer | [Autonomy Subsystem Design](autonomy.md) | Runs dig, travel, dump, travel in AUTO: changes the task mode and sends mechanism commands, but can never enable the robot |
| `diff_drive_controller` | SW.1.2 Drivetrain control | Robot computer | [Drivetrain Subsystem Design](drivetrain.md) | Turns /cmd_vel into left and right wheel speeds within the speed and acceleration limits, drops a command older than cmd_vel_timeout, zeroes the wheels when commands stop, and publishes wheel odometry |
| `joint_state_broadcaster` (drivetrain) | SW.1.2 Drivetrain control | Robot computer | [Drivetrain Subsystem Design](drivetrain.md) | Publishes each wheel joint's position and velocity from the drive hardware plugin's state interfaces |
| Drive mode gate | SW.1.2 Drivetrain control | Robot computer | [Drivetrain Subsystem Design](drivetrain.md) | Writes enable and the task mode to the drive hardware plugin from /robot/mode, writes enable 0 when /robot/mode goes stale, and reports the plugin's faults and stalls on /diagnostics |
| Mechanism node | SW.1.3 Mechanism control | Robot computer | `mechanism.md`, not written yet (4.2) | Runs each mechanism actuator only when the mode allows it, within the mode's limits, and reports whether the excavator is stowed and the hatch is closed |
| `rosbridge_websocket` | SW.4 Bringup, link and logging | Robot computer | `platform.md`, not written yet (2.11) | Carries the operator frontend's topics and service calls over one WebSocket connection; what crosses the radio link is set here (PR #14 review, 2026-10-26) |
| `ros2 bag` recorder | SW.4 Bringup, link and logging | Robot computer | `platform.md`, not written yet (2.11) | Records every run |
| Unitree L2 driver | SW.2.1 Sensor interface and robot model | Robot computer | `sensors.md`, not written yet (6.2) | Publishes the L2's point cloud and its built-in IMU, with Unitree's default names and frames |
| Dedicated IMU driver | SW.2.1 Sensor interface and robot model | Robot computer | `sensors.md`, not written yet (6.2) | Publishes the dedicated IMU's gyroscope and accelerometer in one message, with no magnetometer (system design R5) |
| Camera driver | SW.2.1 Sensor interface and robot model | Robot computer | `sensors.md`, not written yet (6.2) | Publishes the driving camera's compressed images for the operator view |
| Operator frontend | SW.3.1 Operator frontend | Operator laptop, in a browser, through rosbridge | [Teleoperation Subsystem Design](teleoperation.md) | Reads the gamepad through the browser's Gamepad API, sends /joy, the heartbeat, and mode requests through rosbridge, and shows each control source's default view, which the operator can change, with live link bandwidth. It is not a ROS node: rosbridge publishes and calls for it. |
| `teleop_node` | SW.3.2 Teleop mapping | Robot computer | [Teleoperation Subsystem Design](teleoperation.md) | Turns fresh /joy input into drive and mechanism commands, zeroes them when the hold button is released, drops stale input, and requests DISABLED when the controller's input is lost |

## Topics, services, and actions

| Name | Kind | Type | Rate | Publisher or server | Subscriber or client | QoS | Defined in |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/cmd_vel` | topic | `geometry_msgs/msg/TwistStamped` | The active source's rate: `command_rate`, 20 Hz | `command_selector` | `diff_drive_controller` | reliable, volatile, depth 1 | [System Design](system.md) |
| `/mechanism/<function>/command` | topic | luna_interfaces/msg/ActuatorCommand [TBR: proposed in the mechanism doc (4.2)] | The active source's rate: `command_rate`, 20 Hz | `command_selector` | Mechanism node | reliable, volatile, depth 1 | [System Design](system.md) |
| `/diagnostics` | topic | `diagnostic_msgs/msg/DiagnosticArray` | 1 Hz and on change | Drive mode gate, Mechanism node, Camera driver, Dedicated IMU driver, Localization and mapping, Path planning and following, Task sequencer | `mode_manager` | reliable, depth 10 | [System Design](system.md) |
| `/robot/mode` | topic | `luna_interfaces/msg/RobotMode` | 10 Hz and on change | `mode_manager` | Drive mode gate, Mechanism node, `command_selector`, Path planning and following, Task sequencer, Operator frontend, `teleop_node` | reliable, transient local, depth 1 | [Operating Modes Design](operating-modes.md) |
| `/robot/request_mode` | service | `luna_interfaces/srv/RequestMode` | On demand | `mode_manager` | Operator frontend, `teleop_node` | default | [Operating Modes Design](operating-modes.md) |
| `/robot/request_task` | service | `luna_interfaces/srv/RequestTask` | On demand | `mode_manager` | Task sequencer | default | [Operating Modes Design](operating-modes.md) |
| `/power/battery` | topic | `sensor_msgs/msg/BatteryState` | 10 Hz | Power panel reading node | `mode_manager`, Operator frontend | best effort, depth 1 | [Operating Modes Design](operating-modes.md) |
| `/autonomy/odometry` | topic | `nav_msgs/msg/Odometry` | 50 Hz [TBR: autonomy open question 2] | Localization and mapping | Path planning and following, Task sequencer | best effort, volatile, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/obstacle_map` | topic | `nav_msgs/msg/OccupancyGrid` | `map_publish_rate`, 2 Hz [TBR: autonomy open question 2] | Localization and mapping | Path planning and following, Operator frontend | reliable, transient local, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/plan` | topic | `nav_msgs/msg/Path` | On each replan, at most 1 Hz | Path planning and following | Operator frontend | reliable, volatile, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| /auto/cmd_vel [TBR: teleop open question 3] | topic | geometry_msgs/msg/TwistStamped [TBR: matches /teleop/cmd_vel] | `command_rate`, 20 Hz | Path planning and following | `command_selector` | best effort, volatile, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/navigate` | action | nav2_msgs/action/NavigateToPose [TBR: autonomy open question 2] | On demand | Path planning and following | Task sequencer | default | [Autonomy Subsystem Design](autonomy.md) |
| [TBD: AUTO mechanism command topics, teleop open questions 3 and 5] | topic | [TBD: mechanism doc (4.2)] | 20 Hz [TBR: matches teleop's command_rate] | Task sequencer | `command_selector` | [TBD: mechanism doc (4.2)] | [Autonomy Subsystem Design](autonomy.md) |
| `/autonomy/status` | topic | luna_interfaces/msg/AutonomyStatus [TBR: proposed in section 3] | 1 Hz and on change | Task sequencer | None yet | reliable, transient local, depth 1 | [Autonomy Subsystem Design](autonomy.md) |
| `/drivetrain/odom` | topic | `nav_msgs/msg/Odometry` | `publish_rate`, 50 Hz | `diff_drive_controller` | Localization and mapping | the system default: reliable, volatile | [Drivetrain Subsystem Design](drivetrain.md) |
| `/drivetrain/joint_states` | topic | `sensor_msgs/msg/JointState` | The controller manager's `update_rate`, 50 Hz | `joint_state_broadcaster` (drivetrain) | Localization and mapping | the system default: reliable, volatile | [Drivetrain Subsystem Design](drivetrain.md) |
| `/mechanism/status` | topic | [TBD: mechanism doc (4.2)] | [TBD: mechanism doc (4.2)] | Mechanism node | `mode_manager`, Task sequencer, Operator frontend | [TBD: mechanism doc (4.2)] | `mechanism.md`, not written yet (4.2) |
| `unilidar/cloud` | topic | `sensor_msgs/msg/PointCloud2` | [TBD: sensors doc (6.2)] | Unitree L2 driver | Localization and mapping | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| `unilidar/imu` | topic | `sensor_msgs/msg/Imu` | [TBD: sensors doc (6.2)] | Unitree L2 driver | Localization and mapping | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| `imu/data_raw` | topic | `sensor_msgs/msg/Imu` | [TBD: sensors doc (6.2)] | Dedicated IMU driver | Localization and mapping | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| [TBD: camera image topics, sensors doc (6.2)] | topic | sensor_msgs/msg/CompressedImage [TBR: sensors doc (6.2)] | [TBD: sensors doc (6.2)] | Camera driver | Operator frontend | [TBD: sensors doc (6.2)] | `sensors.md`, not written yet (6.2) |
| `/joy` | topic | `sensor_msgs/msg/Joy` | `autorepeat_rate`, 20 Hz, and on change [TBR: teleop draft, PR #14] | Operator frontend | `teleop_node` | [TBD: as rosbridge publishes it, teleoperation doc (5.1)] | [Teleoperation Subsystem Design](teleoperation.md) |
| `/operator/heartbeat` | topic | `std_msgs/msg/Header` | `heartbeat_rate`, 10 Hz, including in AUTO and with the hold button released | Operator frontend | `mode_manager` | best effort, depth 1 | [Teleoperation Subsystem Design](teleoperation.md) |
| `/teleop/cmd_vel` | topic | geometry_msgs/msg/TwistStamped [TBR: teleop draft, PR #14] | `command_rate`, 20 Hz [TBR: teleop draft, PR #14] | `teleop_node` | `command_selector` | best effort, volatile, depth 1 [TBR: teleop draft, PR #14] | [Teleoperation Subsystem Design](teleoperation.md) |
| [TBD: teleop's mechanism command topics, teleop open questions 3 and 5] | topic | [TBD: mechanism doc (4.2)] | `command_rate`, 20 Hz [TBR: teleop draft, PR #14, for the mechanism doc (4.2) to confirm] | `teleop_node` | `command_selector` | [TBD: teleoperation doc (5.1)] | [Teleoperation Subsystem Design](teleoperation.md) |

### Notes

- `/cmd_vel`: Reliable, because the diff drive controller subscribes with the system default QoS, which is reliable, and a reliable subscription never hears a best effort publisher (drivetrain design, section 3).
- `/mechanism/<function>/command`: One topic for each function that moves on its own: depth, excavator, conveyor, and hatch (mechanism design, section 3).
- `/diagnostics`: Every node of ours that can fail reports here; an ERROR puts the robot in FAULT (operating modes, section 7).
- `/autonomy/odometry`: The fused position, heading, and velocity in the map frame. The same estimate is published as the map to odom to base_link transforms.
- `/autonomy/obstacle_map`: 5 cm cells (TPM-4). Rocks and craters are both marked occupied. The operator frontend receives it at no more than 1 Hz, to stay inside its TPM-6 budget of 150 kbit/s in AUTO.
- /auto/cmd_vel [TBR: teleop open question 3]: Matches /teleop/cmd_vel, so the command selection node treats both sources the same.
- `/autonomy/navigate`: The task sequencer sends one goal per travel leg: a dig spot or a dump spot.
- `/autonomy/status`: The cycle step, the cycle count, and why the sequencer stopped, for the operator display, so the operator can tell the Mission Control Judge when an autonomous attempt starts and ends.
- `/drivetrain/odom`: Remapped from the controller's ~/odom. Its own odom to base_link transform is off (enable_odom_tf is false), because localization publishes that transform (autonomy design).
- `/drivetrain/joint_states`: Remapped from joint_states, so the drivetrain's and the mechanism's broadcasters each have a topic of their own.
- `unilidar/cloud`: In frame unilidar_lidar, as Unitree's launch file names it (system design, Hardware lines).
- `unilidar/imu`: In frame unilidar_imu, fixed to the LiDAR (system design, The two IMUs).
- `imu/data_raw`: The main IMU, near the center of mass, following REP 145's names (system design, The two IMUs).
- `/teleop/cmd_vel`: The name comes from the teleop draft (PR #14) [TBR: teleop open question 3, which decides how TELEOP and AUTO commands reach the drivetrain].
- [TBD: teleop's mechanism command topics, teleop open questions 3 and 5]: Teleop open question 5 proposes one command topic per function that moves on its own: drive, coordinated depth raise and lower, excavator, conveyor, and hatch.
