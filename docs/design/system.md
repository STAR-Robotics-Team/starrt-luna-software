# System Design

| Owner | Pair | Status | Last reviewed |
| --- | --- | --- | --- |
| Julian V | To assign | Draft | 2026-10-18 |

This doc shows how the robot's computer, motor controllers, sensors, operator station,
and network connect, and the contracts between subsystems at the hardware. Each
subsystem's own design doc covers its insides; this one covers how they fit together. It
is written in steps (deliverable 1.5): the block diagrams and the hardware lines first,
then the node graph, the team's conventions, and the list of components with their owners
by Oct 28.

## 1. Purpose and requirements

- R1. Every hardware system has one hardware line, which its stand-ins and its real driver
  all meet, so the code above the line runs unchanged in every test mode
  ([Testing layers](testing-layers.md#the-hardware-line)).
- R2. Launch arguments pick stand-ins or real hardware with no code change: one for the
  whole robot, and one per system that overrides it, so a run can mix a real drivetrain
  with stubs for everything else
  ([Testing layers](testing-layers.md#choosing-stand-ins-per-system)). Deliverable 1.4
  decides how.
- R3. The operator station reaches the robot only through the team's access point and
  NASA's cable. A back channel, such as a phone or laptop connecting to the access point
  directly, means disqualification ([§14.5, p. 50](../sources.md#nasa-lunabotics-guidebook-2027)).
- R4. The link averages 4,000 kbit/s or less over a run
  ([§14.1.19, p. 48](../sources.md#nasa-lunabotics-guidebook-2027)). The
  [operating modes design](operating-modes.md#1-purpose-and-requirements) (R10) budgets it
  by mode.
- R5. No GPS or compass feeds the robot's calculations
  ([§13.7, p. 43](../sources.md#nasa-lunabotics-guidebook-2027)), so no magnetometer
  does either.
- R6. A sensor of a kind the robot already has is added as a named instance, with its own
  frame, topics, and stub, without changing the code that reads the others (see
  [Adding a sensor](#adding-a-sensor)).

## 2. Nodes

The node graph comes in two steps: version 0 from the design docs' first drafts, by
Oct 28, and the final graph once the teleoperation, sensors, and mechanism docs settle
their interfaces, by Nov 5. Until then, each subsystem's design doc lists its own nodes;
the [operating modes design](operating-modes.md#2-nodes) lists the first ones.

## 3. Interfaces

Each subsystem's design doc owns its topics, services, and actions. This doc owns the
contracts at the hardware.

### Hardware lines

A hardware line is what every stand-in for a hardware system, and its real driver, must
provide, so the code above it cannot tell them apart. [Testing layers](testing-layers.md)
explains how the line is used, and [Hardware test modes](hardware-test-modes.md) draws
each system in each test mode.

| System | What crosses the line | Stand-ins below it | Design doc |
| --- | --- | --- | --- |
| Drivetrain | 4 wheel joints, 2 per side: a velocity command in; velocity and position out, and current where the motor controller measures it | Stub hardware, fake motor controllers, Gazebo | `drivetrain.md` (3.1) |
| Mechanism | Each mechanism joint's command and state, plus [TBD: the limit switch and stowed signals, which the mechanism doc defines (4.2)] | Stub hardware, fake motor controllers | `mechanism.md` (4.2) |
| Battery and power | `/power/battery` (`sensor_msgs/msg/BatteryState`, 10 Hz) and `/diagnostics` | A stub node, a fake power panel | [Operating modes](operating-modes.md#3-interfaces) |
| LiDAR | The Unitree L2's point cloud and its built-in IMU, as Unitree's driver publishes them: by default `unilidar/cloud` in frame `unilidar_lidar` and `unilidar/imu` in frame `unilidar_imu` ([unitree_lidar_ros2 launch file](../sources.md#unitree-lidar-ros2-launch)) | A stub node, a recording, Gazebo | `sensors.md` (6.2) |
| Dedicated IMU | One `sensor_msgs/msg/Imu`: angular velocity from the gyroscope and linear acceleration from the accelerometer, in the IMU's own frame near the center of mass. No magnetometer. | A stub node, a recording, Gazebo | `sensors.md` (6.2) |
| Cameras | [TBD: the image and camera info topics and frames of the cameras chosen in 6.1] | A test-pattern stub, a recording, Gazebo | `sensors.md` (6.2) |
| Gamepad | `/joy`, with [TBD: the button and stick numbers from the gamepad's table (5.2)] | A recording | `teleoperation.md` (5.1) |
| Radio link | The ROS 2 topics that cross between the operator laptop and the robot: commands, the heartbeat, and telemetry | Both sides on one computer | `teleoperation.md` (5.1) |

The design docs in code font are not written yet; the number after each is its
deliverable.

### The two IMUs

The robot has two IMUs, each fixed to what it measures:

- **The L2's built-in IMU stays part of the LiDAR.** It is a 3-axis accelerometer and a
  3-axis gyroscope ([Unitree L2 manual, p. 17](../sources.md#unitree-l2-manual)), fixed to
  the LiDAR, so it measures the LiDAR's own motion, which is what LiDAR-inertial odometry
  needs.
- **A dedicated IMU near the center of mass** feeds the robot's position estimate
  (deliverable 7.5). Which part: [TBD: the sensor suite evaluation (6.1) picks it].

The gyroscope and the accelerometer stay together in one message, as ROS's convention for
IMU drivers groups them in one `sensor_msgs/Imu` on `imu/data_raw`
([REP 145, section "Topics"](../sources.md#ros-rep-145)). On a typical IMU they come
from one chip with one clock, so splitting them would only add timestamps to line up. A
magnetometer, which REP 145 publishes on its own topic, is a compass, so nothing on the
robot may use one (R5). If the chosen IMU estimates its orientation on the chip, the
driver must use a mode that leaves the magnetometer out.

**Where it mounts.** A gyroscope reads the same anywhere on a rigid frame, because every
point of a rigid body turns at the same rate. An accelerometer away from the robot's
reference point also reads the turning itself, which the estimate can remove once the
robot model (6.3) records where the IMU sits. The center of mass also moves as the bin
fills. So a rigid mount, away from motor vibration, matters more than the exact spot.

### Adding a sensor

The robot can gain sensors without a change to this design. Each sensor is a named
instance of its kind, such as a camera named `front`:

- **Its own frame,** placed in the robot model (6.3) at its mount.
- **Its own topics,** in a namespace with its name. For IMUs, ROS's convention puts the
  main IMU in the `imu` namespace and any other in its own `imu_...` namespace
  ([REP 145, section "Namespacing"](../sources.md#ros-rep-145)); the dedicated IMU is the
  main one.
- **Its own stub,** started once per instance with the instance's name, frame, and topics
  as parameters, so the stand-ins grow with the robot.

A sensor of a new kind gets a new row in [Hardware lines](#hardware-lines), and its own
stub, recording, and Gazebo modes, as [Testing layers](testing-layers.md) describes.

## 4. Parameters

- **Launch arguments** that pick stand-ins or real hardware, one for the whole robot and
  one per system: [TBD: named in deliverable 1.4, by Oct 21].
- **Conventions** for topic names, QoS, frames, and parameter files: [TBD: written with
  the node graph, by Oct 28].

## 5. Libraries and hardware interfaces

| Link | Between | What it carries | Decided in |
| --- | --- | --- | --- |
| CAN bus, 1 Mbit/s ([CAN bus](../can-bus.md)) | The Jetson, through the CANable USB adapter (`can0`), and the motor controllers and power distribution panel | Commands, status, and the enable | [TBD: the controllers, in 3.2 (drive) and 4.3 (mechanism)] |
| Ethernet (UDP) or a serial port (TTL UART), one at a time ([Unitree L2 manual, p. 12](../sources.md#unitree-l2-manual)) | The Jetson and the Unitree L2 | The point cloud and its IMU | Ethernet on the bench (6.6); [TBD: the robot's link, in the sensors doc (6.2)] |
| [TBD] | The Jetson and the cameras and the dedicated IMU | Images and IMU data | 6.1 |
| Wi-Fi | The team's access point and the robot's radio | ROS 2 topics both ways | [TBD: the parts, in 5.7] |
| NASA's Ethernet cable | NASA's switch in Mission Control and the team's access point | ROS 2 topics both ways, past the judges' bandwidth recorder | Supplied by NASA |
| [TBD] | The operator laptop and the gamepad | Stick and button input | 5.2 |

The power path, from the battery through the main breaker, energy logger, and E-stop, is
in the [operating modes design](operating-modes.md#5-libraries-and-hardware-interfaces).

## 6. Block diagram

### The whole robot

```mermaid
---
config:
  flowchart:
    wrappingWidth: 240
---
flowchart TB
  subgraph mcc["Mission Control"]
    direction TB
    pad["`**Gamepad** (5.2)`"] --- laptop["`**Operator laptop**
teleop, operator view; Linux`"]
    laptop --- sw["`**NASA network switch**`"]
  end
  subgraph arena["Arena"]
    direction TB
    ap["`**Team access point**
on the corner shelf (5.7)`"]
    subgraph robot["Robot"]
      direction TB
      radio["`**Robot radio** (5.7)`"] --- jetson["`**Jetson Orin Nano**
every robot node`"]
      jetson ---|USB| can
      subgraph can["CAN bus, 1 Mbit/s"]
        direction TB
        canable["`**CANable USB adapter**
can0`"]
        ctrl["`**Motor controllers**
drive (3.2) and mechanism (4.3), each driving its motor or actuator`"]
        pdp["`**Power distribution panel**
battery voltage and currents`"]
        canable ~~~ ctrl ~~~ pdp
      end
      jetson --- sensors
      subgraph sensors["Sensors (6.1)"]
        direction TB
        lidar["`**Unitree L2 LiDAR**
with its built-in IMU; Ethernet on the bench (6.6)`"]
        imu["`**Dedicated IMU**
near the center of mass`"]
        cams["`**Cameras**`"]
        lidar ~~~ imu ~~~ cams
      end
    end
  end
  sw ---|NASA's cable| ap
  ap -.-|Wi-Fi| radio
  classDef ours fill:#4c669026,stroke:#4c6690
  classDef nasa fill:#8b939c1f,stroke:#8b939c
  classDef hw fill:#4a725926,stroke:#4a7259
  class laptop,jetson ours
  class sw nasa
  class pad,ap,radio,canable,ctrl,pdp,lidar,imu,cams hw
  style mcc fill:#8b939c14,stroke:#8b939c80
  style arena fill:#8b939c14,stroke:#8b939c80
  style robot fill:#8b939c14,stroke:#8b939c80
  style can fill:#8b939c14,stroke:#8b939c80
  style sensors fill:#8b939c14,stroke:#8b939c80
```

Blue boxes run our code, gray is NASA's, and green is the team's hardware. A number names
the deliverable that picks that part. Lines are physical connections; the dotted one is
radio.

### How the operator station reaches the robot

```mermaid
---
config:
  flowchart:
    wrappingWidth: 260
---
flowchart TB
  subgraph mcc["Mission Control Center"]
    direction TB
    laptop["`**Operator laptop and gamepad**
sends commands and the heartbeat`"] <--> sw["`**NASA network switch**`"]
  end
  subgraph arena["Artemis Arena"]
    direction TB
    drop["`**NASA network drop**`"] <--> ap["`**Team access point**
on the corner shelf; the team's GL.iNet Beryl AX is the first candidate (5.7)`"]
    subgraph robot["Robot"]
      direction TB
      radio["`**Robot radio**
the Jetson's own Wi-Fi is the first candidate (5.7)`"] <--> jetson["`**Jetson Orin Nano**
mode manager, drive, sensors`"]
    end
  end
  ap <-. "Wi-Fi, channel 1, 20 MHz" .-> robot
  mcc <-- "NASA's cable, past the judges' bandwidth recorder" --> arena
  classDef ours fill:#4c669026,stroke:#4c6690
  classDef nasa fill:#8b939c1f,stroke:#8b939c
  classDef hw fill:#4a725926,stroke:#4a7259
  class laptop,jetson ours
  class sw,drop nasa
  class ap,radio hw
  style mcc fill:#8b939c14,stroke:#8b939c80
  style arena fill:#8b939c14,stroke:#8b939c80
  style robot fill:#8b939c14,stroke:#8b939c80
```

- **The access point lives in the arena,** on a shelf in a corner, up to 0.5 m above the
  wall, plugged into NASA's network drop: not on the robot, and not in Mission Control
  ([§14.5, p. 50](../sources.md#nasa-lunabotics-guidebook-2027)).
  [The arena and a run](../competition/arena-and-runs.md#how-the-robot-talks-to-mission-control)
  has the guidebook's drawing.
- **During runs, the robot uses Wi-Fi channel 1 only**
  ([§14.4.1, p. 49](../sources.md#nasa-lunabotics-guidebook-2027)), at a 20 MHz channel
  width, on the team's network name "Team_##" with encryption on
  ([§14.1, pp. 47-48](../sources.md#nasa-lunabotics-guidebook-2027)).
- **The laptop and the robot must share one network.** ROS 2 nodes find each other only
  when both machines are on the same network
  ([ROS 2 networking](../ros-networking.md#talk-to-the-robot-or-another-computer)). A
  router between them that translates addresses (NAT) hides the robot from the laptop. In
  Router mode, the Beryl AX runs NAT and its own DHCP server, which hands out addresses; in
  Access Point mode it "disables its NAT and DHCP functions"
  ([GL.iNet network modes guide, section "For models with Wi-Fi"](../sources.md#glinet-network-modes)).
  So [TBD: either NASA's cable goes into one of its LAN ports, or the Beryl AX runs in
  Access Point mode and every device gets a fixed address; 5.7 decides].
- **Deliverable 5.7 decides the parts and the network,** by Oct 28: the access point, the
  robot's radio and antennas, the addresses, and how ROS 2 crosses the link. It also
  settles whether the team's Open-Mesh OM5P-AC radio can be used, and asks the organizers
  about 5 GHz (open question 6).

## 7. Behavior on failure

| Failure | How it is detected | What happens |
| --- | --- | --- |
| The link drops: the access point, the robot's radio, or the cable | No operator heartbeat for `link_timeout` | The robot disables itself, as the [operating modes design](operating-modes.md#7-behavior-on-failure) says |
| The CANable is unplugged or the CAN bus fails | Every motor controller's status goes missing | FAULT, as the operating modes design says |
| A sensor stops publishing | [TBD: defined in the sensors doc (6.2)] | [TBD: defined in the sensors doc (6.2)] |
| A stand-in no longer matches its real driver | The Bench run compares the driver's topics, message types, frames, and rates with the stub | The stub is fixed to match, in the pull request that records the Bench run |

## 8. Test plan

| Requirement | Test | Where | Result |
| --- | --- | --- | --- |
| R1 | Each system's Bench log shows the real driver providing exactly what its stub does | Bench | Not run |
| R2 | The whole robot launches on stubs from the whole-robot argument (deliverable 1.11). Then one system's own argument switches it to real hardware while the rest stay on stubs, and a mix that breaks the rules is refused. | Sim, then Bench | Not run |
| R3 | Communications check rehearsal: control the robot through the access point, with every other radio off | Robot | Not run |
| R4 | Measure the average bandwidth of a practice run at the access point's cable | Bench | Not run |
| R5 | `ros2 topic list` on the running robot shows no magnetometer topic, and the dedicated IMU's driver settings leave the magnetometer out | Robot | Not run |
| R6 | Launch two instances of one sensor stub with different names: each has its own topics and frame, and the code reading the first is unchanged | Sim | Not run |

## 9. Open questions

| Question | Owner | Due |
| --- | --- | --- |
| 1. Which access point, robot radio, and network setup: NASA's cable in a LAN port, or Access Point mode with fixed addresses? (5.7) | Radio link evaluation owner | 2026-10-28 |
| 2. Which dedicated IMU and cameras, and how does each connect to the Jetson? (6.1) | Sensor suite evaluation owner | 2026-10-27 |
| 3. Which drive motor controllers? (3.2) | Drivetrain owner, with the electrical lead | 2026-10-28 |
| 4. Which mechanism motor controllers? (4.3) | Mechanism owner, with the electrical lead | 2026-11-01 |
| 5. How do stand-ins swap in for hardware, system by system, and what are the launch arguments called? (1.4) | Software lead | 2026-10-21 |
| 6. May the robot use 5 GHz during runs? The guidebook's §14.1.17 and §14.4 disagree ([Rules the robot must follow](../competition/robot-rules.md#communications)). Ask the organizers. | Radio link evaluation owner | 2026-10-21 |

## Handoff

Not yet written: this doc is a draft.
