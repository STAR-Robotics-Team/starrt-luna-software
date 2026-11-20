"""Exercise every sandbox joint while explicitly supplying test-only permission."""

import time

from controller_manager_msgs.srv import ListControllers
from luna_mechanism.policy import POSITION_JOINTS, VELOCITY_JOINTS
import rclpy
from rclpy.executors import ExternalShutdownException
from rclpy.node import Node
from sensor_msgs.msg import JointState
from std_msgs.msg import Bool


def main():
    rclpy.init()
    node = Node('mechanism_demo')
    command = node.create_publisher(JointState, '/mechanism_sim/command', 10)
    permission = node.create_publisher(Bool, '/mechanism_sim/motion_allowed', 10)
    try:
        deadline = time.monotonic() + 15.0
        while command.get_subscription_count() == 0 or permission.get_subscription_count() == 0:
            if time.monotonic() >= deadline:
                raise RuntimeError('Gateway not ready; launch stub.launch.py first')
            rclpy.spin_once(node, timeout_sec=0.05)
        client = node.create_client(
            ListControllers, '/mechanism_sim/controller_manager/list_controllers')
        expected = {'joint_state_broadcaster', 'position_controller', 'velocity_controller'}
        ready = False
        while time.monotonic() < deadline:
            if not client.wait_for_service(timeout_sec=0.1):
                continue
            future = client.call_async(ListControllers.Request())
            while not future.done() and time.monotonic() < deadline:
                rclpy.spin_once(node, timeout_sec=0.05)
            if future.done() and future.result() is not None:
                active = {c.name for c in future.result().controller if c.state == 'active'}
                if expected <= active:
                    ready = True
                    break
            rclpy.spin_once(node, timeout_sec=0.05)
        node.destroy_client(client)
        if not ready:
            raise RuntimeError('Mock controllers did not activate before deadline')
        for positions, velocities in (([0.0, 0.0, 0.0], [0.0, 0.0]),
                                      ([0.2, 0.2, 1.0], [1.0, 1.0]),
                                      ([0.0, 0.0, 0.0], [-1.0, -1.0]),
                                      ([0.0, 0.0, 0.0], [0.0, 0.0])):
            node.get_logger().info(f'Positions {positions}; velocities {velocities}')
            end = time.monotonic() + 3.0
            while time.monotonic() < end:
                permission.publish(Bool(data=True))
                msg = JointState()
                msg.header.stamp = node.get_clock().now().to_msg()
                msg.name = list(POSITION_JOINTS + VELOCITY_JOINTS)
                msg.position = positions + [0.0, 0.0]
                msg.velocity = [0.0, 0.0, 0.0] + velocities
                command.publish(msg)
                rclpy.spin_once(node, timeout_sec=0.05)
    except (KeyboardInterrupt, ExternalShutdownException):
        pass
    finally:
        if rclpy.ok():
            permission.publish(Bool(data=False))
            rclpy.spin_once(node, timeout_sec=0.1)
        node.destroy_node()
        rclpy.try_shutdown()
