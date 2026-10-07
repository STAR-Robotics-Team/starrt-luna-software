# Building for the robot

Why a build only runs where it was built for, and how code gets built for the robot's
NVIDIA Jetson. Which approach the robot uses is still being decided: the platform
workstream chooses one in deliverables 2.4 (Jetson bring-up) and 2.5 (robot deployment)
and records it in the platform design doc.

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

## Three ways to build for the Jetson

The Jetson has an arm64 CPU, so code for it has to be built for arm64, against the
robot's operating system and ROS libraries. Building on one kind of computer for another
is called cross-compiling, in the broad sense.

| Approach | How it works | Trade-offs |
| --- | --- | --- |
| Build on the Jetson | Clone the repository on the robot and run `colcon build` there. | No extra setup. Usually slower than a laptop, but this workspace is small. |
| Emulated arm64 image | A laptop builds an arm64 container image, running arm64 programs through the QEMU emulator. | Uses the same Dockerfile. Slow: on one laptop, the first build of this workspace took about 2 minutes emulated versus about 7 seconds natively. |
| True cross-compilation | An x86-64 compiler produces arm64 code and links it against a copy of the robot's libraries, called a sysroot. | Fastest builds, but the sysroot has to be kept identical to the robot's software. ROS's own cross-compiling tool, [`ros-tooling/cross_compile`](https://github.com/ros-tooling/cross_compile), was archived in 2022, so the team would maintain this setup alone. |

For a workspace this size, building on the Jetson or in an emulated image is simpler than
true cross-compilation.

## Try the emulated build

Register the arm64 emulator once per boot, then build the image's `base` stage for arm64:

```bash
docker run --privileged --rm tonistiigi/binfmt --install arm64
docker buildx build --platform linux/arm64 --target base --network=host --load \
  -t luna-base:arm64 -f .devcontainer/Dockerfile .devcontainer
```

`--network=host` avoids DNS failures when one of Docker's own networks overlaps campus
Wi-Fi addresses.

## Apple Silicon Macs

Apple Silicon Macs already build arm64 code in the dev container. That code runs on the
Jetson only if the Jetson's operating system and ROS libraries match the dev container's,
for example if the robot runs the same image.
