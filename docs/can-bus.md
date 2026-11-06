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

**On a Jetson with JetPack 6,** the CANable does not appear as `can0` until you build its
driver. NVIDIA's JetPack 6 kernel leaves out every USB-to-CAN driver, `gs_usb` among them,
where JetPack 5's kernel included them [TBR: read from the kernel configurations NVIDIA
ships for JetPack 5 and 6, not yet checked on our Jetson]. To check, run `modinfo gs_usb`
on the Jetson. If it prints `Module gs_usb not found`, build the driver once:

```bash
scripts/jetson_gs_usb.sh
```

The script downloads the driver's source for the Jetson's kernel version from kernel.org
and installs it with DKMS, then loads it. [TBR: The script has not been run on a Jetson
yet, and whether DKMS rebuilds the driver by itself after a JetPack kernel update is not
known.] If `can0` stops appearing after an update, run the script again. On a laptop with
Ubuntu, the driver is already there.

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

## The power distribution panel

The power distribution panel (PDP) shares the bus with the motor controllers and sends its
readings on its own. Phoenix 5 does not read them
([Phoenix 5 primer](sources.md#ctre-phoenix5-primer)), so our code decodes the frames
itself, using the layout in [WPILib's PDP driver](sources.md#wpilib-ctre-pdp-driver).
With the PDP at CAN ID 0, `candump can0` should show these frames [TBR: worked out from
the driver's frame numbers, not seen on our bus yet]:

| Frame ID | What it is |
| --- | --- |
| `08041400` | Current on channels 0 to 5 |
| `08041440` | Current on channels 6 to 11 |
| `08041480` | Current on channels 12 to 15, battery voltage, and temperature |
| `08041740` | Total current, power, and energy used |

To check that the PDP sends with no roboRIO on the bus, power it together with a motor
controller and watch `candump can0`. If the motor controller's frames appear but nothing
starting with `0804` does, the PDP is not sending on its own. If nothing appears at all,
check the CANable and the wiring first.

## The Phoenix libraries

The Phoenix libraries are not stored in this repository. `colcon build` downloads pinned,
checksum-verified versions from CTRE, because CTRE's license does not allow us to share
them. `src/ctre_phoenix5_vendor/README.md` explains the versions, offline builds, and how
to upgrade.

**Phoenix 5 and Phoenix 6 together.** The Talon FXS controllers the team plans to buy use
Phoenix 6, which needs its own enable signal outside FRC
([Phoenix 6 docs, section "Non-FRC Applications"](sources.md#ctre-phoenix6-enabling-actuators)),
while the Talon SRX and Victor SPX use Phoenix 5. Other Lunabotics teams report that the two
libraries fail when loaded in one program but work as separate programs on one bus [TBR:
reported by other teams, not tried on our bus]. So each library runs in its own driver
node, as the [operating modes design](design/operating-modes.md#5-libraries-and-hardware-interfaces)
describes. A Phoenix 6 controller that has been used with a roboRIO stays locked to FRC
until it is factory-defaulted in Phoenix Tuner X
([Phoenix 6 docs, section "Non-FRC Applications"](sources.md#ctre-phoenix6-enabling-actuators)).
