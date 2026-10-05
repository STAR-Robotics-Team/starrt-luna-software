# starrt-luna-software

Software for the STAR Robotics Team's NASA Lunabotics rover. This repository is one
ROS 2 Jazzy workspace: every robot package, the dev container that builds them on any
laptop, and the design docs the code follows.

## Get started

The code builds and runs in Linux with ROS 2 Jazzy. The dev container provides that on
any operating system: a Docker image with ROS 2 Jazzy and every tool the robot code needs,
defined in `.devcontainer/`. [docs/development-environment.md](docs/development-environment.md)
explains why, how code gets built for the robot, and the other ways to set up.

### Install Docker

- **Windows:** Docker runs on WSL 2, so first run `wsl --install` in an administrator
  PowerShell (it also installs Ubuntu), then install
  [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). For
  faster builds, clone the repository inside Ubuntu rather than on `C:\`.
- **macOS:** install [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/).
  Apple Silicon Macs run the container natively.
- **Linux:** install [Docker Engine](https://docs.docker.com/engine/install/) and add
  yourself to the `docker` group.

### Open the dev container

You clone the repository onto your own computer, like any other repository. When you open
it as a dev container, the editor reads `.devcontainer/devcontainer.json`, builds an image
from `.devcontainer/Dockerfile`, starts a container from that image, and mounts your clone
into it at `/ws`. Your code stays on your computer; the container supplies Linux, ROS 2,
and the tools. Edits made inside or outside the container change the same files.

The typical setup is [VS Code](https://code.visualstudio.com/) with its
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers):

1. Start Docker (on macOS and Windows, open Docker Desktop).
2. Clone the repository and open it in VS Code:

   ```bash
   git clone git@github.com:STAR-Robotics-Team/starrt-luna-software.git
   cd starrt-luna-software
   code .
   ```

   Without an SSH key on GitHub, clone
   `https://github.com/STAR-Robotics-Team/starrt-luna-software.git` instead.
3. VS Code notices `.devcontainer/` and offers **Reopen in Container**. Choose it. If the
   prompt does not appear, open the command palette (Ctrl+Shift+P, or Cmd+Shift+P on
   macOS) and run **Dev Containers: Reopen in Container**.
4. Wait for the first build. It downloads and installs the environment, which takes
   several minutes; later opens take seconds.
5. Open a terminal in VS Code (**Terminal > New Terminal**). You are inside the container
   when the bottom-left corner shows **Dev Container** and the prompt reads
   `ubuntu@...:/ws$`.

Next time, open the folder in VS Code again and it reconnects to the same container. When
someone changes `.devcontainer/`, run **Dev Containers: Rebuild Container** to pick up the
change.

Another editor with dev container support, the Dev Containers CLI in a plain terminal, or
a native ROS 2 Jazzy install on Ubuntu 24.04 also work; see
[Ways to set up](docs/development-environment.md#ways-to-set-up).

### Build and test

In a terminal inside the container (in VS Code, its built-in terminal):

```bash
colcon build
colcon test && colcon test-result --verbose
```

Open a new terminal after building, so it picks up what you built.

### Check that ROS 2 works

Run the talker and listener demo, each in its own terminal:

```bash
ros2 run demo_nodes_cpp talker
```

```bash
ros2 run demo_nodes_cpp listener
```

The listener prints `I heard: [Hello World: 1]`, then 2, 3, and so on.

### GUI tools

By default, RViz, rqt, and other GUI programs open on a desktop that runs in your
browser. Open <http://localhost:6080/vnc.html?autoconnect=true&resize=remote>, which sizes
the desktop to your browser window, then run `rviz2` or `rqt_graph` in a terminal. To get
normal windows instead, on Linux or with XQuartz on macOS, see
[GUI tools](docs/development-environment.md#gui-tools).

## Repository layout

```text
.devcontainer/          dev container: ROS 2 Jazzy, build tools, browser desktop
docs/                   development environment guide
docs/design/            design docs, one per subsystem; start from _template.md
scripts/                install dependencies, bring up CAN interfaces
src/
├── ctre_phoenix5_vendor/   CTRE Phoenix 5 libraries, downloaded at build time
└── luna_drivetrain/        drivetrain; holds last semester's motor bench test
```

Packages planned for this semester, one per workstream: `luna_interfaces`,
`luna_bringup`, `luna_description`, `luna_mechanism`, `luna_teleop`, and `luna_sensors`.
The platform design doc confirms the final names.

## More documentation

- [Development environment](docs/development-environment.md): why Linux, building for
  the robot, setup options, what works on which operating system, the CAN bus, and
  ROS 2 networking.
- [CONTRIBUTING.md](CONTRIBUTING.md): the pull request workflow and conventions. Read it
  before your first pull request.
- [Design docs](docs/design/): one per subsystem, started from
  [`_template.md`](docs/design/_template.md).
- [`ctre_phoenix5_vendor`](src/ctre_phoenix5_vendor/README.md): how the CTRE Phoenix
  libraries are downloaded, and how to upgrade them.

## License

Apache-2.0; see [LICENSE](LICENSE). The CTRE Phoenix libraries are not part of this
repository. They are downloaded from CTRE at build time and are covered by CTRE's own
license; see [`src/ctre_phoenix5_vendor`](src/ctre_phoenix5_vendor/README.md).
