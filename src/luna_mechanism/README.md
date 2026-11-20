# Mechanism stub sandbox

Experimental standalone ROS 2 Jazzy implementation for deliverable 4.4. It includes five
movable joints, `mock_components/GenericSystem`, position and velocity controllers, a
command gate, switchable sensor signals, a demo, and headless launch tests.

**Every dimension, joint name, effort, speed, and position limit in
`urdf/mechanism_sandbox.urdf` is a synthetic test fixture.** The hatch is provisionally
revolute and the depth actuators provisionally position-controlled. This is not the rover
model and must not be used with real hardware. Replace the fixture through coordination
with 4.1, 4.2, and 6.3 as the remaining mechanical and model decisions are resolved.

## Relationship to the current design

`docs/design/mechanism.md` on the current `main` is Approved. This sandbox is an
experimental fixture retained for mock-hardware exploration; it does **not** implement
that design's production controller or hardware line:

- The approved `mechanism_controller` takes a stamped `ActuatorCommand` per function,
  uses normalized `output` joint interfaces, and publishes `MechanismStatus`.
  This sandbox uses one `JointState` command, position/velocity interfaces, and two
  separate Boolean status topics, all under `/mechanism_sim`.
- The approved mode gate consumes `/robot/mode` and writes mode GPIOs. The sandbox
  consumes an explicit test-only Boolean permission; it cannot validate the real mode
  manager, per-task permissions, or the mode gate.
- The approved controller has per-function timeouts, depth synchronization and mismatch
  protection. The sandbox has one aggregate command timeout and neither synchronization
  correction nor mismatch protection.
- The approved stub exposes sensor GPIOs. The sandbox uses two simulation-only services;
  its sensor test does not validate the GPIO hardware line.

The existing design documents and their TOML registries are intentionally unchanged.
Do not substitute this sandbox for acceptance of deliverable 4.4. Moving to the approved
controller, messages, and hardware line is follow-up implementation work. The model,
controller-manager startup, test structure, and timeout/limit test cases provide a
starting point while final geometry and hardware decisions remain unresolved.

## Build and run

From the repository root, in a dev-container terminal:

```bash
source /opt/ros/jazzy/setup.bash
rosdep install --from-paths src/luna_mechanism --ignore-src -r -y
colcon build --packages-select luna_mechanism
source install/setup.bash
ros2 launch luna_mechanism stub.launch.py rviz:=true
```

In a second container terminal with ROS and the workspace sourced:

```bash
ros2 run luna_mechanism mechanism_demo
```

The demo explicitly supplies **test-only motion permission**. It commands both depth
actuators and the hatch between synthetic endpoints, turns the chain and conveyor in
both directions, then stops. RViz uses `base_link` and the sandbox description topic.
The mock is idealized: bounded position joints jump to their targets; this does not
simulate actuator dynamics or enforce bounded-actuator slew rates.

Switch the sensors independently:

```bash
ros2 service call /mechanism_sim/stub/set_stowed std_srvs/srv/SetBool '{data: true}'
ros2 service call /mechanism_sim/stub/set_hatch_closed std_srvs/srv/SetBool '{data: false}'
ros2 topic echo /mechanism_sim/status/stowed
```

These services alter simulation-only status directly. They do not implement GPIO wiring,
read real sensors, or automatically grant motion permission.

## Provisional sandbox interfaces

These names are isolated under `/mechanism_sim`; they do not establish the final robot
contract. All application topics use reliable, volatile, keep-last depth 10 QoS.

| Relative name | Type | Behavior |
| --- | --- | --- |
| `command` | `sensor_msgs/msg/JointState` | Stamped full command; freshness below 0.5 s |
| `motion_allowed` | `std_msgs/msg/Bool` | Explicit test permission heartbeat; expires after 0.5 s |
| `status/stowed` | `std_msgs/msg/Bool` | 50 Hz, initially false |
| `status/hatch_closed` | `std_msgs/msg/Bool` | 50 Hz, initially false |
| `stub/set_stowed` | `std_srvs/srv/SetBool` | Simulation feedback injection |
| `stub/set_hatch_closed` | `std_srvs/srv/SetBool` | Simulation feedback injection |
| `position_controller/commands` | `std_msgs/msg/Float64MultiArray` | Gateway output, 50 Hz |
| `velocity_controller/commands` | `std_msgs/msg/Float64MultiArray` | Gateway output, 50 Hz |
| `joint_state_broadcaster/joint_states` | `sensor_msgs/msg/JointState` | Observed mock state, 100 Hz control loop |

Command `name` must be exactly, in this order:

```text
depth_left_joint, depth_right_joint, hatch_joint, excavator_chain_joint, conveyor_joint
```

`position` and `velocity` must each contain five finite values. Only the first three
positions and last two velocities are used; unused entries must be zero. `effort` must
be empty. Positions are meters for depth and radians for hatch; speeds are radians per
second for chain and conveyor. Future or stale timestamps, malformed commands, denied
permission, and expired permission inhibit motion. Clock rollback also invalidates motion.
Position targets are clamped to the model's bounds and rotation speeds to its velocity
limits. Inhibition holds the last issued position target and commands zero rotation.
A fresh command is required after inhibition. The gateway's `timeout` parameter is a
positive finite number of seconds, default 0.5; its timer runs at 50 Hz.

The low-level controller topics are writable ROS topics, so direct publication bypasses
the gateway's limits and permission checks. Use `command` for acceptance tests. This is
not a hardware safety boundary. If the gateway process dies, its watchdog cannot run;
real integration needs protection in the approved controller/hardware layer.

## Tests

In the dev container, after building:

```bash
colcon test --packages-select luna_mechanism
colcon test-result --verbose
```

The launch test starts the real ros2_control mock and verifies joint-state limit readback,
velocity direction, denial and revocation of permission, heartbeat expiry, and all sensor
combinations. The ROS-independent tests cover malformed and stale commands, clamping,
clock rollback, and the sensor guard truth table. Run those from the repository root:

```bash
PYTHONPATH=src/luna_mechanism python3 -m unittest discover \
  -s src/luna_mechanism/test -p test_policy.py -v
```

`entry_guard()` records the sensor-only truth table from the task: TRAVEL needs both
signals, EXCAVATE needs hatch-closed, DUMP needs stowed. This helper is tested but is not
connected to a mode manager. Real mode-manager integration tests remain pending the actual mode-manager and mode-gate implementations. Integration into `luna_description` and `luna_bringup`,
mechanical geometry and limits, GPIO feedback, approved messages, and the designed
failure behavior still require implementation; see `docs/design/mechanism.md` and its
registry for the current contract and open questions.

Implementation references: ROS 2 Jazzy
[mock components](https://control.ros.org/jazzy/doc/ros2_control/hardware_interface/doc/mock_components_userdoc.html),
[forward controllers](https://control.ros.org/jazzy/doc/ros2_controllers/forward_command_controller/doc/userdoc.html),
and [joint state broadcaster](https://control.ros.org/jazzy/doc/ros2_controllers/joint_state_broadcaster/doc/userdoc.html).
