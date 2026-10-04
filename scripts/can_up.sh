#!/usr/bin/env bash
# Brings up a CANable (or other SocketCAN adapter) at 1 Mbit/s, the bitrate the
# CTRE motor controllers use. Linux only.
#
#   scripts/can_up.sh [interface]    (default: can0)
set -euo pipefail

interface="${1:-can0}"

# The bitrate can only be changed while the interface is down.
sudo ip link set "$interface" down
sudo ip link set "$interface" type can bitrate 1000000
sudo ip link set "$interface" txqueuelen 1000
sudo ip link set "$interface" up

ip -details link show "$interface"
