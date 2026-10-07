# CAN bus

How the code talks to the motor controllers, and how to test it with or without hardware.

Each drive motor has a **motor controller**, a small box that sets how much power the
motor gets. Ours are CTRE Talon SRX and Victor SPX controllers. They are wired together on
a **CAN bus**, a pair of wires that lets the robot's computer send commands to every
controller and hear back from them. The code drives the controllers with CTRE's Phoenix 5
library, which reaches the bus through SocketCAN, the CAN support built into Linux, and a
CANable USB adapter that plugs the bus into a computer.

## What you need

A Linux computer, using either the dev container or a native ROS install. On macOS and
Windows, Docker Desktop cannot pass USB devices into the container, so the CANable does
not work there.

## Bring up the CANable

With the CANable plugged in, bring up `can0` at 1 Mbit/s, the bitrate the motor
controllers use ([Talon SRX User's Guide, p. 5](sources.md#ctre-talon-srx-guide)), then
watch the traffic on the bus:

```bash
scripts/can_up.sh
candump can0
```

`scripts/can_up.sh` takes another interface name as an argument, for example
`scripts/can_up.sh can1`.

## Run the motor bench test

`motor_test` spins the left drive motors at 10% output until you press Ctrl+C. **Lift the
wheels off the ground first.**

```bash
ros2 run luna_drivetrain motor_test
```

The motor controllers stop on their own within 100 ms of the program stopping, because the
program only enables them 100 ms at a time.

## Test without hardware

`scripts/vcan_up.sh` creates a virtual CAN bus. Nothing listens on it, but `candump` shows
every frame your code sends, which is enough to check that the code works.

```bash
scripts/vcan_up.sh can0
candump can0
```

Then run `motor_test` in another terminal. You should see three kinds of frames:

| Frame ID | What it is |
| --- | --- |
| `02040082` | Commands to the Talon SRX with CAN ID 2 |
| `01040081` | Commands to the Victor SPX with CAN ID 1 |
| `000401BF` | Phoenix's enable signal, which keeps the controllers running |

`motor_test` also prints "Firm Vers could not be retrieved" errors, because no real
controllers answer on a virtual bus.

If `scripts/vcan_up.sh` cannot create the interface, run `sudo modprobe vcan` on your
computer, outside the container, and try again.

## The Phoenix libraries

The Phoenix libraries are not stored in this repository. `colcon build` downloads pinned,
checksum-verified versions from CTRE, because CTRE's license does not allow us to share
them. `src/ctre_phoenix5_vendor/README.md` explains the versions, offline builds, and how
to upgrade.
