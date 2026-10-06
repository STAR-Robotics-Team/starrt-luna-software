#!/usr/bin/env bash
# Installs the system packages that the workspace's package.xml files depend on,
# using rosdep. This does not build the workspace; `colcon build` does that and
# creates the install/ folder.
#
# The dev container runs this once when it is created. Run it again after you
# add a dependency to a package.xml.
set -euo pipefail

cd "$(dirname "$0")/.."

ros_setup=/opt/ros/jazzy/setup.bash
if [ ! -f "$ros_setup" ]; then
  echo "ROS 2 Jazzy is not installed ($ros_setup is missing). Use the dev container," \
    "or install ROS 2 Jazzy first (see docs/development-environment.md)." >&2
  exit 1
fi

# rosdep needs ROS_DISTRO, which ROS's setup script sets. Load it here so this
# works from a terminal that has not loaded ROS. The script does not support set -u.
set +u
# shellcheck source=/dev/null
source "$ros_setup"
set -u

sudo apt-get update
rosdep update
rosdep install --from-paths src --ignore-src -y

echo
echo "Dependencies installed. Next, build the workspace with: colcon build"
