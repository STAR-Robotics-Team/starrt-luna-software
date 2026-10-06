# Documentation

Everything you need to set up, build, run, and contribute to the STAR Robotics Team's
Lunabotics rover software. New to the team? Start with
[Getting started](getting-started.md).

## Set up

| Page | Read it when |
| --- | --- |
| [Getting started](getting-started.md) | You are setting up for the first time. |
| [Development environment](development-environment.md) | You want to know how the dev container works, use another editor or no container, or check what works on your operating system. |

## Work day to day

| Page | Read it when |
| --- | --- |
| [Everyday workflow](everyday-workflow.md) | You are editing, building, testing, and running code, or want to run commands from your own terminal with `scripts/dev`. |
| [GUI tools](gui-tools.md) | You want to see RViz, rqt, or another program with a window. |
| [CAN bus](can-bus.md) | You are working with the motor controllers. |
| [ROS 2 networking](ros-networking.md) | Your nodes need to talk to the robot or another computer. |

## Background

| Page | Read it when |
| --- | --- |
| [Building for the robot](building-for-the-robot.md) | You want to know why a build only runs where it was built for, or how code gets built for the robot's Jetson. |

## Team process

| Page | Read it when |
| --- | --- |
| [Contributing](contributing.md) | Before your first pull request. |
| [Design docs](design/README.md) | You are writing or reviewing a subsystem's design doc. |
| [Writing docs](writing-docs.md) | You are adding or changing a page in these docs. |

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
