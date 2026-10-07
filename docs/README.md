# Documentation

Everything you need to set up, build, run, and contribute to the STAR Robotics Team's
Lunabotics rover software. These pages are also published as a website at
<https://star-robotics-team.github.io/starrt-luna-software/>.

- **New to programming, Git, or the command line?** Start with the
  [learning guide](learn/README.md). It assumes no experience at all.
- **Already comfortable with them?** Go straight to [Getting started](getting-started.md).

## Learn

- **[Learning guide](learn/README.md):** the command line, Git and GitHub, containers,
  setting up, ROS 2, and your first pull request, in order, with exercises.
  [Getting started](getting-started.md) is step 4.
- **[Glossary](learn/glossary.md):** plain definitions of every term in these docs.

## Reference

- **[Development environment](development-environment.md):** how the dev container works,
  using another editor or no container, and what works on each operating system.
- **[Everyday workflow](everyday-workflow.md):** editing, building, testing, and running
  code, and running commands from your own terminal with `scripts/dev`.
- **[GUI tools](gui-tools.md):** seeing RViz, rqt, and other programs with windows.
- **[CAN bus](can-bus.md):** working with the motor controllers, with or without hardware.
- **[ROS 2 networking](ros-networking.md):** connecting your nodes to the robot or another
  computer.
- **[Building for the robot](building-for-the-robot.md):** why a build only runs where it
  was built for, and how code gets built for the robot's Jetson.

## Design docs

- **[All design docs](design/README.md):** how the robot's software fits together, and
  each subsystem's design: its nodes, interfaces, parameters, and behavior on failure, with
  each doc's status and how to write and review one.
- **[Design doc template](design/template.md):** the starting point for a new design doc.

## Team process

- **[Contributing](contributing.md):** branches, pull requests, and code style. Read it
  before your first pull request.
- **[Writing docs](writing-docs.md):** adding or changing a page in these docs.

## Package documentation

Each package can have a README next to its code. For example,
`src/ctre_phoenix5_vendor/README.md` explains how the CTRE Phoenix motor controller
libraries are downloaded and upgraded.

## Learning ROS 2

- [ROS 2 Jazzy tutorials](https://docs.ros.org/en/jazzy/Tutorials.html): the official
  introduction to nodes, topics, services, and building packages.
- [Docker's ROS 2 guide](https://docs.docker.com/guides/ros2/): a hands-on turtlesim and
  rqt exercise. It uses ROS 2 Humble and its own sample setup; in our dev container, skip
  its setup and `apt install` steps, because turtlesim and rqt are already installed, and
  start at "Install and run Turtlesim" step 3, `ros2 run turtlesim turtlesim_node`.
- [REP 2000](https://www.ros.org/reps/rep-2000.html): which operating systems each ROS 2
  release supports.
