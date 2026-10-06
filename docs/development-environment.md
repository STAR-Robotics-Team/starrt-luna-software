# Development environment

How laptops, the dev container, and the robot fit together, and what each setup can do.
To set up for the first time, follow [Getting started](getting-started.md) instead.

## The short version

- **Writing code** works on any computer, in any editor. The code is ordinary files in
  your clone of the repository.
- **Building and running** happens in Linux with ROS 2 Jazzy. You get that from the dev
  container on any operating system, or by installing Ubuntu 24.04 and ROS 2 Jazzy
  directly.
- **The robot** runs the code on its NVIDIA Jetson. See
  [Building for the robot](building-for-the-robot.md).

## How the dev container works

You clone the repository onto your own computer, like any other repository. When you open
it as a dev container, your editor (or `scripts/dev`):

1. builds a Docker image from `.devcontainer/Dockerfile`, with Ubuntu 24.04, ROS 2 Jazzy,
   and the team's tools;
2. starts a container from that image;
3. mounts your clone into the container at `/ws`;
4. when the container is first created, installs the workspace's dependencies with
   `scripts/install_deps.sh`.

Your code stays on your computer, and the container supplies the environment around it.
Edits made inside or outside the container change the same files.

| What | Where it lives | Kept when the container is rebuilt? |
| --- | --- | --- |
| Your code, and everything else in the repository | Your computer, seen in the container at `/ws` | Yes |
| Build output: `build/`, `install/`, `log/` | Your computer, inside your clone (Git ignores it) | Yes |
| ROS 2, compilers, and tools | The container image | Rebuilt from `.devcontainer/Dockerfile` |
| The container's home folder (`/home/ubuntu`), with shell history and the CTRE download cache | The container | No |

The container shares your computer's network, so on Linux it can reach USB CAN adapters
and the robot directly. See [CAN bus](can-bus.md) and
[ROS 2 networking](ros-networking.md).

## The two configurations

The repository has two dev container configurations. They build the same environment and
differ only in how programs with windows, such as RViz, appear.

| Configuration | File | Programs with windows | Use it on |
| --- | --- | --- | --- |
| **STAR Lunabotics: VNC desktop (any OS)**, the default | `.devcontainer/devcontainer.json` | On a VNC desktop inside the container | Any operating system |
| **STAR Lunabotics: native windows (Linux, no VNC)** | `.devcontainer/linux-native/devcontainer.json` | As normal windows on your desktop | Linux |

[GUI tools](gui-tools.md) explains both. To switch, pick the other configuration when you
open the container: in VS Code with **Dev Containers: Reopen in Container**, or with
`scripts/dev --native`.

## Ways to open the dev container

### VS Code (typical)

Install [VS Code](https://code.visualstudio.com/) and its
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers),
open your clone, and choose **Reopen in Container**.
[Getting started](getting-started.md#3-open-the-dev-container) has the steps. VS Code runs
its C++ and Python tools inside the container, so autocomplete and error highlighting
understand ROS. It stops the container when you close the window.

### Another editor

Editors with dev container support, such as JetBrains IDEs, read the same
`.devcontainer/` configuration.

### Your own terminal, with `scripts/dev`

`scripts/dev` runs commands in the dev container from your own terminal, so you can use
any editor: `scripts/dev build`, `scripts/dev shell`, and so on. See
[Everyday workflow](everyday-workflow.md#run-commands-from-your-own-terminal).

An editor running outside the container cannot see ROS's headers, which live in the
container, so its C++ autocomplete does not understand ROS code. Building and running are
unaffected.

### The Dev Containers CLI directly

`scripts/dev` is built on the [Dev Containers CLI](https://github.com/devcontainers/cli),
which you can also use directly:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bash
```

Add `--config .devcontainer/linux-native/devcontainer.json` to both for the native windows
configuration. If you have not installed the CLI, replace `devcontainer` with
`npx @devcontainers/cli`, which needs Node.js.

## Without a container (Ubuntu 24.04)

On Ubuntu 24.04 you can install ROS 2 directly instead of using the dev container:

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

Programs with windows open as normal windows. To use the dev container on the same clone
later, see [One clone, one environment](#one-clone-one-environment).

## What works where

| | Dev container on Linux | Dev container on macOS or Windows | Ubuntu 24.04 without a container |
| --- | --- | --- | --- |
| Build, test, and run nodes | Yes | Yes\* | Yes |
| Programs with windows (RViz, rqt) | VNC desktop, or native windows | VNC desktop through an editor\*, or native windows with XQuartz on macOS (not RViz) | Normal windows |
| CANable USB adapter | Yes | No; Docker Desktop cannot pass USB devices through | Yes |
| Virtual CAN bus (`vcan`) | Yes | Not tested | Yes |
| ROS 2 with the robot or other computers | Yes | Usually not; see [ROS 2 networking](ros-networking.md) | Yes |
| Gamepad | Not set up yet (deliverable 5.2) | Not set up yet | Yes, with ROS's `joy` package\* |

\* Expected but not tested yet. Update this table when you test one of these.

## One clone, one environment

The dev container and a native ROS install can share a clone, but not its build output.
The build output records the absolute paths it was created with: `build/` in CMake's
settings, and `install/` in links back to your source files. The two environments see
your clone at different paths (`/ws` inside the container), so whichever builds second
fails with:

```text
CMake Error: The current CMakeCache.txt directory /ws/build/... is different than the
directory ... where CMakeCache.txt was created
```

When you switch between them, delete the build output first. The next build recreates it.

```bash
rm -rf build install log
```

## Why Linux with ROS 2 Jazzy

The team standardizes on Ubuntu 24.04 with ROS 2 Jazzy for three reasons:

1. **It is ROS 2 Jazzy's main platform.** [REP 2000](https://www.ros.org/reps/rep-2000.html)
   lists Ubuntu 24.04 as Tier 1 for both x86-64 and arm64, with ready-made apt packages
   for ROS and for community packages such as sensor drivers. Windows 10 is also Tier 1,
   but only as an archive of ROS's core packages, and macOS is Tier 3, meaning you build
   ROS yourself from source.
2. **The robot runs Linux.** Developing on the same operating system means what works on
   your laptop works on the robot.
3. **The drivetrain needs SocketCAN,** the CAN bus support built into the Linux kernel.
   It is how the code reaches the motor controllers through the CANable adapter, and
   Windows and macOS do not have it.

The dev container is this environment, packaged, so every operating system gets the same
setup.

## Changing the ROS 2 version

The ROS 2 release (currently Jazzy) is a team decision, not a personal setting. Every
package, every member's environment, and the robot must use the same release, because a
node built against one release does not run on another. To check which release a terminal
is using, run `echo $ROS_DISTRO`.

### In the dev container

The container has exactly one release installed (`/opt/ros/jazzy`), built into its image,
so there is no other `setup.bash` to switch to. Changing the release means changing the
image for everyone, in a pull request:

1. In `.devcontainer/Dockerfile`, replace `jazzy` in the base image
   (`ros:jazzy-ros-base`), the desktop package (`ros-jazzy-desktop`), and the `setup.bash`
   line. The base image brings the Ubuntu version that release needs.
2. Replace `jazzy` in `scripts/install_deps.sh`, and update these docs.
3. Rebuild the container, with **Dev Containers: Rebuild Container** in VS Code or
   `scripts/dev rebuild`.
4. Delete `build/`, `install/`, and `log/`, then run `colcon build`, because everything
   was built against the old release.

### On a native install

Several releases can be installed side by side under `/opt/ros/<release>`, but only those
built for your Ubuntu version. On Ubuntu 24.04, apt has Jazzy and Kilted, but not Humble,
which targets Ubuntu 22.04. Each terminal uses the release whose `setup.bash` it loaded:

- Load one release per terminal. Loading a second on top of the first mixes them, and ROS
  warns: "Please make sure that the environment does not mix paths from different
  distributions." Open a new terminal instead.
- If your `~/.bashrc` loads a release, every new terminal starts with it, so change that
  line to switch.
- After switching, delete `build/`, `install/`, and `log/` and rebuild.
