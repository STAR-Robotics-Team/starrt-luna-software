# ROS 2 networking

How ROS 2 nodes find each other, and how to connect your computer to the robot or to
another computer.

## The default: only your own computer

ROS 2 nodes find each other automatically over the network. On campus Wi-Fi, that would
mean seeing, and possibly driving, other members' nodes. So the dev container sets
`ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST`: your nodes only find nodes on your own
computer.

On Linux, this includes ROS 2 nodes running outside the container on the same computer,
because the container shares your computer's network and shared memory.

On a native install, set it yourself in your `~/.bashrc` (see
[Without a container](development-environment.md#without-a-container-ubuntu-2404)).

## Talk to the robot or another computer

Run this in each terminal, on both machines, with the same domain ID. A domain ID is a
number from 0 to 101 that keeps separate groups of nodes apart, so agree on one with the
people you are working with:

```bash
export ROS_AUTOMATIC_DISCOVERY_RANGE=SUBNET
export ROS_DOMAIN_ID=<agreed id>
```

Both machines need to be on the same network.

## macOS and Windows

On macOS and Windows, Docker runs containers inside a virtual machine, which usually
blocks ROS 2 discovery across the network. To talk to the robot from your laptop, use
Linux, either the dev container there or a native install.
