#!/usr/bin/env bash
# Installs the system packages that the workspace's package.xml files depend on.
# The dev container runs this once when it is created. Run it again after you
# add a dependency to a package.xml.
set -euo pipefail

cd "$(dirname "$0")/.."

sudo apt-get update
rosdep update
rosdep install --from-paths src --ignore-src -y
