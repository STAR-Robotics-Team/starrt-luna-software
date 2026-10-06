# starrt-luna-software

Software for the STAR Robotics Team's NASA Lunabotics rover: one ROS 2 Jazzy workspace
with every robot package, a dev container that runs it on any laptop, and the design docs
the code follows.

## Start here

- **New to programming, Git, or the command line?** The
  [learning guide](docs/learn/README.md) teaches everything from the beginning, with
  exercises.
- **Ready to set up?** [Getting started](docs/getting-started.md) takes you from nothing to
  a working setup.

## Documentation

All documentation lives in [docs/](docs/README.md). The pages you will use most:

| Page | What it covers |
| --- | --- |
| [Learning guide](docs/learn/README.md) | The command line, Git, containers, and ROS 2, from the beginning |
| [Getting started](docs/getting-started.md) | First-time setup |
| [Everyday workflow](docs/everyday-workflow.md) | Editing, building, testing, and running code, from VS Code or your own terminal |
| [Contributing](docs/contributing.md) | Branches, pull requests, and code style |
| [Design docs](docs/design/README.md) | Each subsystem's design and interfaces |

## Repository layout

```text
.devcontainer/              dev container configurations: the default with a VNC desktop,
                            and linux-native/ without it
docs/                       documentation, starting at docs/README.md
docs/design/                design docs, one per subsystem
scripts/                    scripts/dev, dependency install, and CAN setup
src/
├── ctre_phoenix5_vendor/   CTRE Phoenix 5 libraries, downloaded at build time
└── luna_drivetrain/        drivetrain; holds last semester's motor bench test
```

Packages planned for this semester, one per workstream: `luna_interfaces`,
`luna_bringup`, `luna_description`, `luna_mechanism`, `luna_teleop`, and `luna_sensors`.
The platform design doc confirms the final names.

## License

Apache-2.0; see [LICENSE](LICENSE). The CTRE Phoenix libraries are not part of this
repository. `colcon build` downloads them from CTRE, and they are covered by CTRE's own
license; see `src/ctre_phoenix5_vendor/README.md`.
