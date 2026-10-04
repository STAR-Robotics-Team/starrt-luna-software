# Development image for the STAR Lunabotics rover: ROS 2 Jazzy on Ubuntu 24.04,
# for x86-64 and arm64 hosts.
#
#   base  ROS 2 plus the tools to build and run the workspace, no GUI
#   dev   base plus desktop tools (RViz, rqt, demos); the dev container uses it
#
# CI and the Jetson can build from "base" (deliverables 2.3 and 2.4).

FROM ros:jazzy-ros-base AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      can-utils \
      iproute2 \
    && rm -rf /var/lib/apt/lists/*

RUN echo 'source /opt/ros/jazzy/setup.bash' >> /etc/bash.bashrc


FROM base AS dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      bash-completion \
      gdb \
      less \
      nano \
      ros-jazzy-desktop \
      sudo \
    && rm -rf /var/lib/apt/lists/*

# Ubuntu 24.04 images include a non-root "ubuntu" user (UID 1000). Let it use
# sudo without a password so rosdep can install packages.
RUN echo 'ubuntu ALL=(root) NOPASSWD:ALL' > /etc/sudoers.d/ubuntu \
    && chmod 0440 /etc/sudoers.d/ubuntu

# Source the workspace in every shell once it has been built.
RUN echo 'if [ -f /ws/install/setup.bash ]; then source /ws/install/setup.bash; fi' \
      >> /etc/bash.bashrc
