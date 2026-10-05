# Development environment

How laptops, the dev container, and the robot fit together: where code is written, where
it is built and run, and what each setup can do. The [README](../README.md) has the quick
start; this page has the details and the reasons behind them.

## The short version

- **Writing code** works on any computer, in any editor. The code is ordinary files in
  your clone of the repository.
- **Building and running** happens in Linux with ROS 2 Jazzy. You get that from the dev
  container on any operating system, or by installing Ubuntu 24.04 and ROS 2 Jazzy
  directly. A build runs anywhere its environment matches, not only on the computer that
  built it (see [Why a build is tied to its environment](#why-a-build-is-tied-to-its-environment)).
- **The robot** runs the code on its NVIDIA Jetson. How code gets built for the Jetson is
  still being decided (see [Building for the robot](#building-for-the-robot)).

## Why Linux with ROS 2 Jazzy

The team standardizes on Ubuntu 24.04 with ROS 2 Jazzy for three reasons:

1. **It is ROS 2 Jazzy's main platform.** [REP 2000](https://www.ros.org/reps/rep-2000.html)
   lists Ubuntu 24.04 as Tier 1 for both x86-64 and arm64, with ready-made apt packages for
   ROS and for community packages such as sensor drivers. Windows 10 is also Tier 1, but
   only as an archive of ROS's core packages, and macOS is Tier 3, meaning you build ROS
   yourself from source.
2. **The robot runs Linux.** Developing on the same operating system means what works on
   your laptop works on the robot.
3. **The drivetrain needs SocketCAN,** the CAN bus support built into the Linux kernel.
   It is how the code reaches the motor controllers through the CANable adapter, and
   Windows and macOS do not have it.

The dev container is this environment, packaged: an Ubuntu 24.04 image with ROS 2 Jazzy
and the team's tools, defined in [`.devcontainer/`](../.devcontainer/). It gives every
operating system the same setup.

## Why a build is tied to its environment

Compiling turns C++ source code into machine code for one specific environment:

- **CPU type:** x86-64 (most laptops) or arm64 (the Jetson and Apple Silicon Macs).
- **Operating system and its libraries,** such as Ubuntu 24.04's C and C++ standard
  libraries.
- **ROS version and its libraries.** A node built against ROS 2 Jazzy needs Jazzy's
  libraries to run.

A compiled program runs wherever those three match, not only on the computer that built
it. For example, every container started from the dev container image has the same
operating system and ROS libraries, so a program built in one runs in any other on a
computer with the same CPU type. Python nodes are not compiled, but they still need the
same ROS version and Python packages.

### One clone, one environment

The `build/` folder is the exception: it records the absolute paths it was created with.
If you use both the dev container and a native ROS install on the same clone, they see the
folder at different paths (`/ws` inside the container), and the second one to build fails
with:

```text
CMake Error: The current CMakeCache.txt directory /ws/build/... is different than the
directory ... where CMakeCache.txt was created
```

When you switch between the two, delete the build output first. The next build recreates
it:

```bash
rm -rf build install log
```

## Building for the robot

The Jetson has an arm64 CPU and most laptops are x86-64, so code for the robot has to be
built for arm64, against the robot's operating system and ROS libraries. Building for a
different CPU or operating system than the one doing the build is called
cross-compiling in the broad sense. There are three ways to do it:

| Approach | How it works | Trade-offs |
| --- | --- | --- |
| Build on the Jetson | Clone the repository on the robot and run `colcon build` there. | No extra setup. Usually slower than a laptop, but this workspace is small. |
| Emulated arm64 image | A laptop builds an arm64 container image, running arm64 programs through the QEMU emulator (`docker buildx build --platform linux/arm64`). | Uses the same Dockerfile. Slow: on one laptop, the first build of this workspace took about 2 minutes emulated versus about 7 seconds natively. |
| True cross-compilation | An x86-64 compiler produces arm64 code and links it against a copy of the robot's libraries (a "sysroot"). | Fastest builds, but the sysroot has to be kept identical to the robot's software. ROS's own cross-compiling tool, [`ros-tooling/cross_compile`](https://github.com/ros-tooling/cross_compile), was archived in 2022, so the team would maintain this setup alone. |

For a workspace this size, building on the Jetson or in an emulated image is simpler than
true cross-compilation. The platform workstream chooses one in deliverables 2.4 (Jetson
bring-up) and 2.5 (robot deployment), and records it in the platform design doc.

To try the emulated approach, register the arm64 emulator once per boot, then build the
image's `base` stage for arm64:

```bash
docker run --privileged --rm tonistiigi/binfmt --install arm64
docker buildx build --platform linux/arm64 --target base --network=host --load \
  -t luna-base:arm64 -f .devcontainer/Dockerfile .devcontainer
```

`--network=host` avoids DNS failures when one of Docker's own networks overlaps campus
Wi-Fi addresses.

Apple Silicon Macs already build arm64 code in the dev container. That code runs on the
Jetson only if the Jetson's operating system and ROS libraries match the dev container's,
for example if the robot runs the same image.

## Ways to set up

### Dev container in VS Code (typical)

Install [VS Code](https://code.visualstudio.com/) and its
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers),
open your clone, and choose **Reopen in Container**. VS Code builds the image the first
time, installs the workspace's dependencies, and forwards the browser desktop's port.

### Dev container in another editor

Editors with dev container support, such as JetBrains IDEs, read the same
`.devcontainer/devcontainer.json` and open the same container.

### Dev container from a terminal

The [Dev Containers CLI](https://github.com/devcontainers/cli) needs Node.js. From your
clone:

```bash
npx @devcontainers/cli up --workspace-folder .
npx @devcontainers/cli exec --workspace-folder . bash
```

The CLI does not forward ports
([devcontainers/cli#22](https://github.com/devcontainers/cli/issues/22)), so on macOS and
Windows the browser desktop is only reachable through an editor.

### Without a container (Ubuntu 24.04)

1. Install ROS 2 Jazzy by following the
   [official guide](https://docs.ros.org/en/jazzy/Installation/Ubuntu-Install-Debs.html),
   including `ros-dev-tools`.
2. Add these lines to your `~/.bashrc`, so every terminal loads ROS and matches the dev
   container's settings:

   ```bash
   source /opt/ros/jazzy/setup.bash
   export ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST
   export COLCON_DEFAULTS_FILE=<path to your clone>/.devcontainer/colcon-defaults.yaml
   ```

3. Open a new terminal and install the workspace's dependencies. If rosdep asks you to run
   `sudo rosdep init`, run it once and try again.

   ```bash
   scripts/install_deps.sh
   ```

4. Build, then load the workspace in each new terminal:

   ```bash
   colcon build
   source install/setup.bash
   ```

## What works where

| | Dev container on Linux | Dev container on macOS or Windows | Ubuntu 24.04 without a container |
| --- | --- | --- | --- |
| Build, test, and run nodes | Yes | Yes\* | Yes |
| GUI tools (RViz, rqt) | Browser desktop | Browser desktop, through an editor\* | Normal windows |
| CANable USB adapter | Yes | No; Docker Desktop cannot pass USB devices through | Yes |
| Virtual CAN bus (`vcan`) | Yes | Not tested | Yes |
| ROS 2 with the robot or other computers | Yes | Usually not; see [ROS 2 networking](#ros-2-networking) | Yes |
| Gamepad | Not set up yet (deliverable 5.2) | Not set up yet | Yes, with ROS's `joy` package\* |

\* Expected but not tested yet. Update this table when you test one of these.

## CAN bus

The motor controllers are CTRE Talon SRX and Victor SPX, driven by CTRE Phoenix 5 over
SocketCAN through a CANable adapter. On Linux, with the CANable plugged in:

```bash
scripts/can_up.sh                  # bring up can0 at 1 Mbit/s
candump can0                       # watch traffic on the bus
ros2 run luna_drivetrain motor_test
```

`motor_test` spins the left drive motors at 10% output until you press Ctrl+C. Lift the
wheels off the ground first.

Without hardware, `scripts/vcan_up.sh can0` creates a virtual `can0`, and `candump can0`
shows every frame your code sends. If it cannot create the interface, run
`sudo modprobe vcan` on the host computer, outside the container, and try again.

## ROS 2 networking

ROS 2 nodes find each other automatically over the network. On campus Wi-Fi, that would
mean seeing, and possibly driving, other members' nodes. So the dev container sets
`ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST`: your nodes only find nodes on your own
computer. Set it yourself in a native install (see
[Without a container](#without-a-container-ubuntu-2404)).

The dev container shares your computer's network, so on Linux it can reach other
computers directly. To talk to the robot or another computer, run this in each terminal
on both machines, with the same domain ID (0 to 101):

```bash
export ROS_AUTOMATIC_DISCOVERY_RANGE=SUBNET
export ROS_DOMAIN_ID=<agreed id>
```

On macOS and Windows, Docker runs containers inside a virtual machine, which usually
blocks ROS 2 discovery across the network.
