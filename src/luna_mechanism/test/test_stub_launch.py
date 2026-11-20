"""Headless checks against actual GenericSystem joint states and stub services."""

from pathlib import Path
import time
import unittest

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
import launch_testing
import launch_testing.actions
import launch_testing.asserts
from luna_mechanism.policy import POSITION_JOINTS, VELOCITY_JOINTS
import rclpy
from sensor_msgs.msg import JointState
from std_msgs.msg import Bool
from std_srvs.srv import SetBool


def generate_test_description():
    path = Path(get_package_share_directory('luna_mechanism')) / 'launch/stub.launch.py'
    return LaunchDescription([
        IncludeLaunchDescription(PythonLaunchDescriptionSource(str(path))),
        launch_testing.actions.ReadyToTest(),
    ])


class TestStub(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rclpy.init()
        cls.node = rclpy.create_node('mechanism_stub_test')

    @classmethod
    def tearDownClass(cls):
        cls.node.destroy_node()
        rclpy.shutdown()

    def test_motion_limits_permission_and_sensors(self):
        self.states = {}
        self.velocities = {}
        self.sequence = 0

        def state(msg):
            self.states = dict(zip(msg.name, msg.position))
            self.velocities = dict(zip(msg.name, msg.velocity))
            self.sequence += 1

        state_sub = self.node.create_subscription(
            JointState, '/mechanism_sim/joint_state_broadcaster/joint_states', state, 10)
        command = self.node.create_publisher(JointState, '/mechanism_sim/command', 10)
        permission = self.node.create_publisher(Bool, '/mechanism_sim/motion_allowed', 10)

        def wait(predicate, tick=lambda: None, timeout=15.0):
            end = time.monotonic() + timeout
            while time.monotonic() < end:
                tick()
                rclpy.spin_once(self.node, timeout_sec=0.02)
                if predicate():
                    return
            self.fail('Timed out waiting for fresh simulation evidence')

        def send(allowed, positions, velocities):
            permission.publish(Bool(data=allowed))
            msg = JointState()
            msg.header.stamp = self.node.get_clock().now().to_msg()
            msg.name = list(POSITION_JOINTS + VELOCITY_JOINTS)
            msg.position = positions + [0.0, 0.0]
            msg.velocity = [0.0, 0.0, 0.0] + velocities
            command.publish(msg)

        def close_positions(target):
            return all(abs(self.states.get(n, 999.0) - v) < 0.002
                       for n, v in zip(POSITION_JOINTS, target))

        wait(lambda: len(self.states) == 5 and command.get_subscription_count() > 0
             and permission.get_subscription_count() > 0)
        # Repeated commands ensure success requires active controllers, not only discovery.
        wait(lambda: close_positions([0.2, 0.0, 1.0])
             and all(abs(self.velocities.get(n, 999.0) - v) < 0.01
                     for n, v in zip(VELOCITY_JOINTS, [2.0, -2.0])),
             lambda: send(True, [9.0, -9.0, 9.0], [9.0, -9.0]))
        wait(lambda: close_positions([0.0, 0.2, 0.0])
             and all(abs(self.velocities.get(n, 999.0) - v) < 0.01
                     for n, v in zip(VELOCITY_JOINTS, [-2.0, 2.0])),
             lambda: send(True, [-9.0, 9.0, -9.0], [-9.0, 9.0]))
        start_angles = [self.states[n] for n in VELOCITY_JOINTS]
        wait(lambda: all((self.states[n] - initial) * sign > 0.05
                         for n, initial, sign in zip(
                             VELOCITY_JOINTS, start_angles, [-1.0, 1.0])),
             lambda: send(True, [0.0, 0.2, 0.0], [-2.0, 2.0]))
        permission.publish(Bool(data=False))
        wait(lambda: all(abs(self.velocities.get(n, 999.0)) < 0.001
                         for n in VELOCITY_JOINTS))
        before = self.sequence
        wait(lambda: self.sequence > before + 20,
             lambda: send(False, [0.1, 0.1, 0.5], [1.0, 1.0]))
        self.assertTrue(close_positions([0.0, 0.2, 0.0]))
        self.assertTrue(all(abs(self.velocities[n]) < 0.001 for n in VELOCITY_JOINTS))
        # Loss of both command and permission heartbeats must stop rotation.
        wait(lambda: all(abs(self.velocities.get(n, 0.0) - 1.0) < 0.01
                         for n in VELOCITY_JOINTS),
             lambda: send(True, [0.0, 0.2, 0.0], [1.0, 1.0]))
        wait(lambda: all(abs(self.velocities.get(n, 999.0)) < 0.001
                         for n in VELOCITY_JOINTS), timeout=3.0)

        sensors = {}
        subs = []
        clients = {}
        for name in ('stowed', 'hatch_closed'):
            def update(msg, key=name):
                sensors[key] = msg.data
            subs.append(self.node.create_subscription(
                Bool, f'/mechanism_sim/status/{name}', update, 10))
            clients[name] = self.node.create_client(
                SetBool, f'/mechanism_sim/stub/set_{name}')
            self.assertTrue(clients[name].wait_for_service(timeout_sec=5.0))
        for stowed, closed in ((False, False), (True, False), (True, True), (False, True)):
            for name, value in zip(clients, (stowed, closed)):
                future = clients[name].call_async(SetBool.Request(data=value))
                wait(future.done)
                self.assertTrue(future.result().success)
            wait(lambda: sensors == {'stowed': stowed, 'hatch_closed': closed})
        self.node.destroy_subscription(state_sub)
        for sub in subs:
            self.node.destroy_subscription(sub)
        for client in clients.values():
            self.node.destroy_client(client)
        self.node.destroy_publisher(command)
        self.node.destroy_publisher(permission)


@launch_testing.post_shutdown_test()
class TestShutdown(unittest.TestCase):
    def test_processes_exit_cleanly(self, proc_info):
        launch_testing.asserts.assertExitCodes(proc_info)
