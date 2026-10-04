#!/usr/bin/env bash
# Creates a virtual CAN interface for testing without hardware. Nothing listens
# on it, but `candump <interface>` shows every frame your code sends. Linux only.
#
#   scripts/vcan_up.sh [interface]    (default: vcan0)
#
# Use `scripts/vcan_up.sh can0` to run code that expects the real bus, such as
# luna_drivetrain's motor_test.
set -euo pipefail

interface="${1:-vcan0}"

if ! ip link show "$interface" > /dev/null 2>&1; then
  if ! sudo ip link add dev "$interface" type vcan; then
    echo "Could not create $interface. Load the vcan kernel module on the host" \
      "(outside the container) with: sudo modprobe vcan" >&2
    exit 1
  fi
fi
sudo ip link set up "$interface"

ip link show "$interface"
