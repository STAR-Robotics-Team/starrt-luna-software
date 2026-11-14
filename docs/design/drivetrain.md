# [Drivetrain] Subsystem Design

>
> Status is one of `Draft` (being written), `Approved` (reviewed, no code yet),
> `In progress` (code being written to match), `Current` (code matches), or `Superseded`
> (replaced; link the replacement). [Design docs](README.md#status) explains each one.

| Owner | Pair | Status | Last reviewed |
| --- | --- | --- | --- |
| [Aadhav] | [name] | Draft | [2026-10-18] |
| --- | --- | --- | --- |

## 1. Purpose and requirements

- R1. Obey `/robot/mode`. If the last mode message is older than `mode_timeout`, or none has arrived, act as DISABLED.
- R2. Turn the wheels only while the robot is ENABLED. Output is zero after boot and after a fault is cleared, and the drivetrain never enables the robot itself.
- R3. Stop fast. Output is zero within 100 ms of a disable command, within `link_timeout` plus 100 ms of the last operator heartbeat ([guidebook §13.9.19, p. 45](../sources.md#nasa-lunabotics-guidebook-2027)), and within `mode_timeout` plus 100 ms if `mode_manager` stops. This holds in every task mode.
- R4. After the robot is enabled again, never replay an old command. The first output comes from a command received after the enable, ramped up from zero.
- R5. Follow the task mode's limits: 30 A per motor in TRAVEL, 15 A in EXCAVATE, DUMP, and SERVICE, and creep output in EXCAVATE and DUMP. The power budget relies on this (operating modes R7).
- R6. Detect a stalled drive motor and stop it before it overheats. The current limit alone does not protect it ([operating modes, Current limits per mode](operating-modes.md#current-limits-per-mode)).
- R7. Run the same drive code on stub hardware, fake motor controllers, Gazebo, and the real controllers ([system R1](system.md#1-purpose-and-requirements)).
- R8. Keep drivetrain data on the operator link at or below 50 kbit/s TBR. Full-rate data stays on the Jetson (operating modes R10).

## 2. Nodes

| Node | Package | Runs on | What it does |
| --- | --- | --- | --- |
| [drivetrain_node] | [luna_drivetrain] | [Jetson] |  Drives the wheels only when `/robot/mode` allows it, within the task mode's limits. Sets the motor controllers' limits and reports wheel state and faults |
| --- | --- | --- | --- |


## 3. Interfaces

This table is the contract between this subsystem and the rest of the robot. The code must
match it exactly, and a pull request that changes an interface updates this table in the
same pull request.

| Name | Kind | Type | Rate | Publisher or server | Subscriber or client | QoS |
| --- | --- | --- | --- | --- | --- | --- |
| `/robot/mode`              | topic | `luna_interfaces/msg/RobotMode`       | 10 Hz and on change    | `mode_manager`            | `drivetrain_node`  | reliable, transient local, depth 1 |
| `/cmd_vel`                 | topic | `geometry_msgs/msg/Twist` TBR         | 20 Hz TBR              | Active command source (Q5) | `drivetrain_node` | best effort, depth 1 TBR           |
| `/drivetrain/joint_states` | topic | `sensor_msgs/msg/JointState`          | 50 Hz (`control_rate`) | `drivetrain_node`         | Localization (7.5) | sensor data: best effort, depth 5  |
| `/diagnostics`             | topic | `diagnostic_msgs/msg/DiagnosticArray` | 1 Hz and on change     | `drivetrain_node`         | `mode_manager` | reliable, depth 10 |
| --- | --- | --- | --- | --- | --- | --- |

## 4. Parameters

| Parameter | Node | Type | Default | Units | Meaning |
| --- | --- | --- | --- | --- | --- |
| `mode_timeout`                 | `drivetrain_node` | double    | 0.3      | s          | If the last `/robot/mode` is older than this, act as DISABLED          |
| `cmd_vel_timeout`              | `drivetrain_node` | double    | 0.25 TBR | s          | If the last drive command is older than this, output is zero           |
| `creep_output`                 | `drivetrain_node` | double    | 0.2      | fraction   | Largest drive output in EXCAVATE and DUMP                              |
| `current_limit.drive.travel`   | `drivetrain_node` | double    | 30 TBR   | A          | Supply current limit per drive motor in TRAVEL                         |
| `current_limit.drive.excavate` | `drivetrain_node` | double    | 15 TBR   | A          | Same, in EXCAVATE                                                      |
| `current_limit.drive.dump`     | `drivetrain_node` | double    | 15 TBR   | A          | Same, in DUMP                                                          |
| `current_limit.drive.service`  | `drivetrain_node` | double    | 15 TBR   | A          | Same, in SERVICE                                                       |
| `voltage_compensation`         | `drivetrain_node` | double    | 12.0     | V          | Motor controllers scale their output to this voltage                   |
| `control_rate`                 | `drivetrain_node` | double    | 50 TBR   | Hz         | Control loop rate, which also feeds the Phoenix enable                 |
| `output_ramp`                  | `drivetrain_node` | double    | TBD      | fraction/s | Largest change in output per second. A disable skips it                |
| `stall_current`                | `drivetrain_node` | double    | TBD      | A          | Motor current that counts as stalled                                   |
| `stall_time`                   | `drivetrain_node` | double    | TBD      | s          | How long the current must stay above `stall_current`                   |
| `wheel_radius`                 | `drivetrain_node` | double    | TBD      | m          | Measured on the robot                                                  |
| `track_width`                  | `drivetrain_node` | double    | TBD      | m          | Effective track width of the skid-steer drive, calibrated on the robot |
| `max_wheel_speed`              | `drivetrain_node` | double    | TBD      | rad/s      | Wheel speed at output 1.0                                              |
| `can_interface`                | `drivetrain_node` | string    | `can0`   | None       | SocketCAN interface of the CANable adapter                             |
| `controller_ids`               | `drivetrain_node` | int array | TBD      | None       | CAN IDs of the drive controllers; must match `expected_can_devices`    |

## 5. Libraries and hardware interfaces

- **Phoenix 5 enable.**
    The motor controllers run only while some process calls `ctre::phoenix::unmanaged::Unmanaged::FeedEnable(timeoutMs)`. They disable themselves when `timeoutMs` passes without another call ([Phoenix C++ API, section "FeedEnable()"](../sources.md#ctre-phoenix5-unmanaged-api)). Our code passes 100 ms, which matches R3. The enable frame (`000401BF` in `candump`, see [CAN bus](../can-bus.md)) has no device number, so it looks like it enables every CTRE controller on the bus. Exactly one process may feed it, and only while ENABLED (Q1). The feed runs inside the control loop, so a hung loop stops it.
- **CAN bus.**
    The Jetson reaches the controllers through the CANable USB adapter as `can0` at 1 Mbit/s. TBD the call that points Phoenix 5 at `can0`.
- **PDP over CAN.**
    The PDP reports battery voltage, the current on each channel, and the energy used ([PDP User's Guide, pp. 17-20](../sources.md#ctre-pdp-guide)), which feed `/power/battery`. Logging them by mode checks the power budget against real runs.
- **Motor controller settings.**
    At startup, `drivetrain_node` sets each controller's voltage compensation and neutral mode (brake, so the robot holds still when disabled). It sets the current limit at startup and again on every task mode change. Only a Talon SRX can enforce a current limit. A Victor SPX cannot even measure its current ([Phoenix 5 docs, section "Plot tab"](../sources.md#ctre-phoenix5-motor-controllers)) (Q2).
- **E-stop, main breaker, and energy logger.**
    Hardware only, with no software interface. See the [power path](operating-modes.md#5-libraries-and-hardware-interfaces).


## 6. Block diagram

flowchart TB
  mm["mode_manager"]
  cmd["Active drive command source (Q5)"]
  subgraph jetson ["Jetson Orin Nano"]
    dt["drivetrain_node"]
    line{{"hardware line"}}
    driver["Real driver: Phoenix 5 on can0"]
    stub["Stand-ins: stub, fake controllers, Gazebo"]
  end
  adapter["CANable USB adapter"]
  subgraph can ["CAN bus, 1 Mbit/s"]
    ctrl["Drive motor controllers (3.2)"]
    pdp["PDP"]
  end
  motors["4 drive motors"]

  mm -.->|"/robot/mode"| dt
  cmd -->|s13| dt
  dt -->|s14| mm
  dt --- line
  line --- driver
  line --- stub
  driver -->|s15| adapter
  adapter <--> ctrl
  adapter <--> pdp
  ctrl --> motors

## 7. Behavior on failure

| Failure                                 | How it is detected                                      | What the subsystem does |
| --- |                                   | --- |                                                   | --- |
| Operator link lost                      | No heartbeat for `link_timeout`, seen by `mode_manager` | `mode_manager` publishes DISABLED. The drivetrain zeroes its output and stops feeding the enable |
| `mode_manager` stops                    | `/robot/mode` older than `mode_timeout`, or none yet    | Acts as DISABLED. Resumes only after a fresh ENABLED |
| The node feeding the enable stops       | The Phoenix enable times out                            | Controllers disable themselves within 100 ms and hold in brake |
| Drive commands stop                     | Last command older than `cmd_vel_timeout`               | Output zero; mode unchanged |
| A bad drive command                     | NaN, infinite, or above the limits                      | NaN or infinite: treated as zero, with a WARN on `/diagnostics`. Above the limits: clamped to the task mode's cap |
| A motor controller or the CAN bus fails | Its CAN status goes missing, or it reports a fault      | Output zero and an ERROR on `/diagnostics`, so `mode_manager` enters FAULT |
| A drive motor stalls                    | Current above `stall_current` for `stall_time`          | Output zero and a WARN on `/diagnostics`. Driving resumes after the command returns to zero TBR |
| Battery low                             | `mode_manager` halves every current limit               | The drivetrain halves its limits too. How it learns this is open (Q3) |
| E-stop pressed                          | Hardware cuts power                                     | Nothing to do in software. The node restarts in BOOT with output zero |

## 8. Test plan

| Requirement | Test | Where | Result  |
| ---        | ---   | ---   | --- |
| R1, R2      | Step `/robot/mode` through every state and task mode on fake data, then stop publishing it. Output follows the mode and is zero when the mode goes stale. After boot, send commands while DISABLED: nothing moves and `candump can0` shows no enable frame | Sim, then Bench | Not run |
| R3          | Drive in each task mode, then disable, unplug the operator Wi-Fi, and kill `mode_manager`, one at a time. Measure the time to zero output in the bag | Bench           | Not run |
| R4          | Disable while driving, hold the command, and enable again. The output ramps from zero and uses only commands received after the enable | Bench           | Not run |
| R5          | Read each controller's current limit back in every task mode. Command full output in EXCAVATE and DUMP: it stays at creep. Block a wheel briefly and log the PDP current | Bench | Not run |
| R6          | Block one wheel and command output. The node stops it within `stall_time` and warns on `/diagnostics` | Bench | Not run |
| R7          | Launch on stubs, fake controllers, Gazebo, and the real controllers with no code change. The Bench log shows the real driver matching its stub | Sim, then Bench | Not run |
| R8          | Measure the drivetrain's bandwidth at the operator laptop with `ros2 topic bw` | Bench | Not run |

## 9. Open questions

| Question | Owner | Due |
| --- | --- | --- |
| [question] | [name] | [YYYY-MM-DD] |

## Handoff

TBR