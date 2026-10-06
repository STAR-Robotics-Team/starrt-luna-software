# Getting started

This page takes you from nothing to a working setup: the dev container running, the
workspace built and tested, and ROS 2 and the VNC desktop working. Most of the time is
spent waiting for the first build.

The dev container is a ready-made Linux environment with ROS 2 Jazzy and every tool the
robot code needs. It runs in Docker, so it works the same on Windows, macOS, and Linux.
[Development environment](development-environment.md) explains how it works.

## 1. Install the tools

You need Git, Docker, and an editor. These steps use the typical setup, VS Code with its
Dev Containers extension. Other editors, a plain terminal, or a native ROS install also
work; see
[Ways to open the dev container](development-environment.md#ways-to-open-the-dev-container).

**Docker:**

- **Windows:** Docker runs on WSL 2, so first run `wsl --install` in an administrator
  PowerShell. It also installs Ubuntu, which you will use as your terminal. Then install
  [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/).
- **macOS:** install
  [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/). Apple
  Silicon Macs run the container natively.
- **Linux:** install [Docker Engine](https://docs.docker.com/engine/install/) and add
  yourself to the `docker` group.

**VS Code:** install [VS Code](https://code.visualstudio.com/) and its
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

**Git:** run `git --version` in a terminal to check you have it. On Windows, use the
Ubuntu (WSL) terminal for this and every later step.

## 2. Clone the repository

```bash
git clone git@github.com:STAR-Robotics-Team/starrt-luna-software.git
cd starrt-luna-software
```

Without an SSH key on GitHub, clone
`https://github.com/STAR-Robotics-Team/starrt-luna-software.git` instead.

On Windows, clone inside Ubuntu (for example in your home folder), not on `C:\`. Builds
are much faster there.

## 3. Open the dev container

1. Start Docker. On macOS and Windows, open Docker Desktop.
2. Open the repository in VS Code:

   ```bash
   code .
   ```

3. VS Code notices the `.devcontainer/` folder and offers **Reopen in Container**. Choose
   it. If the prompt does not appear, open the command palette (Ctrl+Shift+P, or
   Cmd+Shift+P on macOS) and run **Dev Containers: Reopen in Container**.
4. When VS Code asks which configuration to use, pick
   **STAR Lunabotics: VNC desktop (any OS)**. The other one is for Linux users who want
   programs to open as normal windows; see [GUI tools](gui-tools.md).
5. Wait for the first build. It downloads and installs the environment, which takes
   several minutes; later opens take seconds.
6. Open a terminal with **Terminal > New Terminal**. You are inside the container when the
   bottom-left corner of VS Code shows **Dev Container** and the prompt reads
   `ubuntu@...:/ws$`. The terminal also prints where the VNC desktop is.

Your clone stays on your computer. The container sees it at `/ws`, so edits made in VS
Code, in another editor, or in a container terminal all change the same files.

## 4. Build and test

In the container terminal:

```bash
colcon build
colcon test && colcon test-result --verbose
```

The first build downloads CTRE's motor controller libraries, so it needs internet. The
build ends with a summary such as `Summary: 2 packages finished`, and the tests with one
such as `Summary: 18 tests, 0 errors, 0 failures, 2 skipped`. The numbers grow as
packages are added; what matters is `0 errors, 0 failures`.

Open a new terminal after building, so it picks up what you built.

## 5. Check that ROS 2 works

Run the talker and listener demo, each in its own terminal:

```bash
ros2 run demo_nodes_cpp talker
```

```bash
ros2 run demo_nodes_cpp listener
```

The listener prints `I heard: [Hello World: 1]`, then 2, 3, and so on. Press Ctrl+C in
each terminal to stop them.

## 6. Open the VNC desktop

Programs with windows, such as RViz, appear on a desktop that runs inside the container.
Open it in your browser at
<http://localhost:6080/vnc.html?autoconnect=true&resize=remote>, then start RViz in a
container terminal:

```bash
rviz2
```

An RViz window with a grid appears on the desktop. [GUI tools](gui-tools.md) covers the
other ways to see programs, such as a VNC viewer app or native windows.

## Next steps

- [Everyday workflow](everyday-workflow.md): the edit, build, and run loop, and running
  commands from your own terminal.
- [Contributing](contributing.md): read it before your first pull request.
- [Design docs](design/README.md): how your workstream's design doc works.
- [Learning ROS 2](README.md#learning-ros-2): tutorials and a hands-on turtlesim exercise.
