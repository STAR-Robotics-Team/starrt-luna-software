# starrt-luna-software

Software for the STAR Robotics Team's NASA Lunabotics rover. This repository is one
ROS 2 Jazzy workspace: every robot package, the dev container that builds them on any
laptop, and the design docs the code follows.

## Get started

You need [Docker](https://docs.docker.com/get-started/get-docker/),
[VS Code](https://code.visualstudio.com/), and VS Code's
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

- **Windows:** install [WSL 2](https://learn.microsoft.com/windows/wsl/install) and Docker
  Desktop, then clone the repository inside WSL (for example in `~/`), not on `C:\`.
- **macOS:** install Docker Desktop. Apple Silicon Macs run the container natively.
- **Linux:** install Docker Engine and add yourself to the `docker` group.

Then:

1. Clone the repository and open it in VS Code:

   ```bash
   git clone git@github.com:STAR-Robotics-Team/starrt-luna-software.git
   code starrt-luna-software
   ```

2. Choose **Reopen in Container** when VS Code offers it, or run
   **Dev Containers: Reopen in Container** from the command palette. The first time, this
   downloads and builds the environment, which takes several minutes.
3. In VS Code's terminal, which now runs inside the container, build and test the
   workspace:

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

RViz, rqt, and other GUI programs open on a desktop that runs in your browser. Open
<http://localhost:6080/vnc.html?autoconnect=true&resize=remote>, which sizes the desktop
to your browser window, then run `rviz2` or `rqt_graph` in a terminal.

## Repository layout

```text
.devcontainer/          dev container: ROS 2 Jazzy, build tools, browser desktop
docs/design/            design docs, one per subsystem; start from _template.md
scripts/                install dependencies, bring up CAN interfaces
src/
├── ctre_phoenix5_vendor/   CTRE Phoenix 5 libraries, downloaded at build time
└── luna_drivetrain/        drivetrain; holds last semester's motor bench test
```

Packages planned for this semester, one per workstream: `luna_interfaces`,
`luna_bringup`, `luna_description`, `luna_mechanism`, `luna_teleop`, and `luna_sensors`.
The platform design doc confirms the final names.

## Hardware

### CAN bus

The motor controllers are CTRE Talon SRX and Victor SPX, driven by CTRE Phoenix 5 over
SocketCAN through a CANable adapter. On a Linux computer with the CANable plugged in:

```bash
scripts/can_up.sh                  # bring up can0 at 1 Mbit/s
candump can0                       # watch traffic on the bus
ros2 run luna_drivetrain motor_test
```

`motor_test` spins the left drive motors at 10% output until you press Ctrl+C. Lift the
wheels off the ground first.

Without hardware, `scripts/vcan_up.sh can0` creates a virtual `can0`, and `candump can0`
shows what your code sends. The first time, you may need to run `sudo modprobe vcan` on
the host, outside the container.

USB CAN adapters only reach the container on Linux. On macOS and Windows, Docker runs
inside a virtual machine that cannot see them.

### ROS 2 networking

The container shares your computer's network, and `ROS_AUTOMATIC_DISCOVERY_RANGE` is set
to `LOCALHOST`. Your nodes only find other nodes on your own computer, so on campus Wi-Fi
you never see, or accidentally drive, another member's nodes.

To talk to the robot or another computer, run this in each terminal on both machines, with
the same domain ID (0 to 101):

```bash
export ROS_AUTOMATIC_DISCOVERY_RANGE=SUBNET
export ROS_DOMAIN_ID=<agreed id>
```

This works from Linux. On macOS and Windows, the virtual machine that Docker runs in
usually blocks ROS 2 discovery across the network.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening your first pull request.

## License

Apache-2.0; see [LICENSE](LICENSE). The CTRE Phoenix libraries are not part of this
repository. They are downloaded from CTRE at build time and are covered by CTRE's own
license; see [`src/ctre_phoenix5_vendor`](src/ctre_phoenix5_vendor/README.md).
