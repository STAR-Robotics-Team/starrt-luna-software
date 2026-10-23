# Teleoperation Subsystem Design

| Owner | Pair | Status | Last reviewed |
| --- | --- | --- | --- |
| Nick | [TBD: software lead to assign] | Draft | 2026-10-18 |

Design for the team’s Linux operator station and ROS 2 Jazzy environment. Hardware validation is pending. TBR means a proposal needs review; TBD means a detail remains undecided.

## 1. Purpose and requirements

Teleoperation maps gamepad inputs to robot commands and provides operator controls. Robot permissions and stopping behavior follow [Operating Modes Design](operating-modes.md).

- R1. Read every required gamepad input inside the team’s Linux development container.
- R2. Require ENABLED, TELEOP, hold-to-enable, and task permission for manual motion.
- R3. Provide enable, disable, clear-fault, control-source, and task controls; never automatically enable.
- R4. Stop on input or link loss; reconnection must not automatically resume motion.
- R5. Display acknowledged state and mode-appropriate streams.
- R6. Record the mapping, configuration, and test results.

Tasks are TRAVEL, EXCAVATE, DUMP, and SERVICE. SERVICE requires TELEOP and `allow_service=true`. Permission to drive during EXCAVATE or run the conveyor during DUMP remains unresolved.

## 2. Nodes

| Node | Package | Runs on | What it does |
| --- | --- | --- | --- |
| `joy_node` | `joy` | Linux operator station, in container | Reads gamepad input. |
| `teleop_node` | `luna_teleop` | Linux operator station, in container | [TBR: proposed names.] Maps inputs, sends heartbeat and mode requests, and provides operator controls. |
| `rviz2` | `rviz2` | Linux operator station | [TBR: proposed viewer.] Displays selected robot data. |

Actuator nodes enforce limits, source selection, and timeouts.

## 3. Interfaces

This table is the contract between this subsystem and the rest of the robot. The code must
match it exactly, and a pull request that changes an interface updates this table in the
same pull request.

Mode interfaces follow the operating-modes design. Drive and mechanism interfaces require agreement with the controls owners. “Teleop” below refers to `teleop_node`.

| Name | Kind | Type | Rate | Publisher or server | Subscriber or client | QoS |
| --- | --- | --- | --- | --- | --- | --- |
| `/joy` | topic | `sensor_msgs/msg/Joy` | [TBR: 20 Hz + changes] | `joy_node` | Teleop | [TBD: verify driver QoS] |
| `/robot/mode` | topic | `luna_interfaces/msg/RobotMode` | 10 Hz + changes | `mode_manager` | Teleop | Reliable, transient local, depth 1 |
| `/robot/request_mode` | service | `luna_interfaces/srv/RequestMode` | On demand | `mode_manager` | Teleop | Default |
| `/operator/heartbeat` | topic | `std_msgs/msg/Header` | 10 Hz | Teleop | `mode_manager` | Best effort, depth 1 |
| [TBR: `/teleop/cmd_vel`] | topic | [TBR: `geometry_msgs/msg/TwistStamped`] | [TBR: 20 Hz] | Teleop | Robot command selection | [TBR: best effort, volatile, depth 1] |
| Mechanism commands | topic | [TBD: mechanism contract] | [TBD] | Teleop | Mechanism command selection | [TBD] |
| Camera/map/path streams | topic | [TBD: sensor/autonomy contracts] | Mode-dependent | Sensor/autonomy nodes | Operator view | [TBD] |

`RequestMode` carries `state`, `source`, and `task`. From FAULT, request DISABLED to clear once the cause is gone, then separately request ENABLED. Display rejection reasons and confirm accepted changes through `/robot/mode`. **Actions:** None.

## 4. Parameters

| Parameter | Node | Type | Default | Units | Meaning |
| --- | --- | --- | --- | --- | --- |
| `device_name` | `joy_node` | string | [TBD: enumerate] | None | Selected controller. |
| `deadzone` | `joy_node` | double | [TBR: 0.05] | Fraction | Ignore small stick drift. |
| `autorepeat_rate` | `joy_node` | double | [TBR: 20] | Hz | Refresh unchanged input. |
| `hold_button` | Teleop | integer | [TBD: measured index] | None | Manual-motion permission. |
| `input_timeout` | Teleop | double | [TBR: 0.15] | s | Reject stale input. |
| speed/mechanism limits | Teleop | Configuration | [TBD: owners approve] | Per actuator | Match robot-side limits. |

The operating-modes design owns `link_timeout=0.5 s` and actuator `mode_timeout=0.3 s`. Robot command timeouts require agreement with the controls owners.

## 5. Libraries and hardware interfaces

Use `joy`, the proposed `luna_teleop` package, `luna_interfaces`, and the team Ubuntu 24.04/ROS 2 Jazzy container ([Development environment](../development-environment.md)).

**Gamepad:** Plan to use the team’s Xbox controller over USB to avoid an additional wireless connection. [TBD: confirm model and USB data cable availability.] [TBR: mapping below; driver and mechanism review required.]

| Control | Action |
| --- | --- |
| LB held | Permit manual actuator demands. |
| Left stick vertical / horizontal | Drive forward or reverse / steer. |
| Right stick vertical | Coordinated depth raise/lower. |
| RT / LT | Excavator chain forward/reverse. |
| D-pad up/down | Conveyor forward/reverse. |
| A / X | Hatch open/close. |
| Laptop controls | Enable, disable, clear fault, select control source and task. |

Releasing LB zeros all manual demands. Opposing commands for the same actuator produce zero. Task permissions apply; AUTO ignores gamepad input. After input loss, require explicit enable and a fresh LB release and press before manual motion resumes.

**Hardware testing:** Verify controller detection and `/joy` inside the Linux development container. Record device identity, button and axis indices, signs, and disconnect behavior. Confirm that repeated input messages cannot conceal a disconnected controller. Use these results to select device access and permissions.

**Network:** Follow [System Design](system.md): operator laptop → NASA switch and cable → team access point → Wi-Fi → robot. Decision 5.7 tracks final hardware, addresses, and discovery settings. Validate using the Linux operator station and [ROS 2 networking](../ros-networking.md).

**View:** [TBR: RViz2 plus operator controls.] TELEOP displays camera and telemetry. AUTO displays the obstacle map and planned path, with camera streaming off. Other states show low-rate status and faults. Follow the operating-modes bandwidth rules.

Other subsystems own CAN, motor wiring, current limits, and the physical E-stop.

## 6. Block diagram

```mermaid
flowchart TD
  pad["Xbox controller"] --> joy["joy_node in container"]
  joy --> teleop["Teleop and operator controls"]
  teleop -->|"Heartbeat and mode requests"| modes["mode_manager"]
  modes -->|"Acknowledged state"| teleop
  teleop -->|"Manual demands"| robot["Robot command selection and actuator nodes"]
  auto["Autonomy"] --> robot
  modes -->|"Source and task permissions"| robot
```

## 7. Behavior on failure

| Failure | How it is detected | What the subsystem does |
| --- | --- | --- |
| Controller/input lost in TELEOP | Connection check and input timeout | Zero manual demands; request DISABLED. |
| Operator or Wi-Fi lost | Robot heartbeat timeout | `mode_manager` disables, including in AUTO. |
| Publisher stops | Robot command and mode timeouts | Actuators independently zero outputs. |
| Fault/E-stop | Robot safety/hardware | Follow modes recovery; never automatically enable. |

Verify operating-modes requirement R3 on hardware: zero outputs within 100 ms of disable, and within `link_timeout + 100 ms` of the last heartbeat. Robot controls own recovery and current limits.

## 8. Test plan

Follow [Testing Layers](testing-layers.md). In Sim, fake or recorded `/joy` messages replace the gamepad, with robot hardware on stand-ins. Bench requires passing Sim tests and a reviewed procedure; Robot requires a merged Bench log. Record results and recordings in the run logs.

| Requirement | Test | Where | Result |
| --- | --- | --- | --- |
| R1 | Enumerate device; observe every required input on `/joy` inside the Linux development container. | Bench | Not run |
| R2 | Test deadzone, axis signs, opposing commands, and hold release; verify task restrictions and AUTO ignoring input. | Unit, then Sim | Not run |
| R3 | Check accepted and rejected requests and clear-then-enable recovery. | Sim, then Bench | Not run |
| R4 | Stop input and processes in Sim; disconnect controller and Wi-Fi on hardware. Measure stopping times and verify reconnection requires rearming. | Sim, Bench, Robot | Not run |
| R2–R4 | Repeat manual control, task restrictions, stopping, and recovery on the rover, on blocks before floor tests. | Robot | Not run |
| R5 | Verify acknowledged status and stream changes with stand-ins, then across the real network. | Sim, Bench, Robot | Not run |
| R6 | Teammate repeats recorded setup and mapping. | Bench | Not run |

## 9. Open questions

| Question | Owner | Due |
| --- | --- | --- |
| Which Xbox controller model and USB data cable are available? | [TBD: identify controller holder] | Before bench testing |
| Which Linux station and tested input mapping will be used? | [TBD: assign teleoperation testing owner] | Bench test |
| What topics/message types carry movement commands, and which code selects TELEOP/AUTO commands? | Controls/mechanism owners | Before integration |
| What final network settings and operator viewer will be used? | Networking/teleop owners | Before integration |
| May the robot drive while excavating, may the conveyor run during DUMP, and how is fault/E-stop recovery implemented? | Modes/mechanical owners | Modes review |

## Handoff

- Design draft complete for team review.
- Implementation and hardware validation remain pending.
- Controller verification is pending a bench test.
- Network and mechanism interfaces still need team agreement.
- Next: bench-test `/joy`, mapping, hold release, and disconnection.
