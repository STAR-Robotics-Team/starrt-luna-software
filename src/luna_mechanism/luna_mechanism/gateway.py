"""Simulation-only command gate and independently switchable sensor signals."""

from luna_mechanism.policy import MotionPolicy, POSITION_JOINTS, VELOCITY_JOINTS
import rclpy
from rclpy.executors import ExternalShutdownException
from rclpy.node import Node
from sensor_msgs.msg import JointState
from std_msgs.msg import Bool, Float64MultiArray
from std_srvs.srv import SetBool


class Gateway(Node):
    """Bridge provisional stamped commands to ros2_control controllers."""

    def __init__(self):
        super().__init__('mechanism_stub_gateway')
        description = self.declare_parameter('robot_description', '').value
        timeout = self.declare_parameter('timeout', 0.5).value
        self.policy = MotionPolicy(description, timeout)
        self.position_pub = self.create_publisher(
            Float64MultiArray, 'position_controller/commands', 10)
        self.velocity_pub = self.create_publisher(
            Float64MultiArray, 'velocity_controller/commands', 10)
        self.create_subscription(JointState, 'command', self.command, 10)
        self.create_subscription(Bool, 'motion_allowed', self.permission, 10)
        self.sensors = {'stowed': False, 'hatch_closed': False}
        self.sensor_pubs = {}
        for name in self.sensors:
            self.sensor_pubs[name] = self.create_publisher(Bool, f'status/{name}', 10)
            self.create_service(SetBool, f'stub/set_{name}', self.sensor_callback(name))
        self.create_timer(0.02, self.update)

    def now(self):
        return self.get_clock().now().nanoseconds / 1e9

    def permission(self, msg):
        self.policy.permit(msg.data, self.now())

    def command(self, msg):
        expected = list(POSITION_JOINTS + VELOCITY_JOINTS)
        if (msg.name != expected or len(msg.position) != 5 or len(msg.velocity) != 5
                or msg.effort):
            self.policy.command_time = None
            return
        stamp = msg.header.stamp.sec + msg.header.stamp.nanosec / 1e9
        # Validate unused entries too; the complete message must be finite.
        if any(value != 0.0 for value in msg.position[3:] + msg.velocity[:3]):
            self.policy.command_time = None
            return
        self.policy.command(msg.position[:3], msg.velocity[3:], stamp, self.now())

    def sensor_callback(self, name):
        def set_sensor(request, response):
            self.sensors[name] = request.data
            response.success = True
            response.message = 'Simulation feedback updated'
            return response
        return set_sensor

    def update(self):
        positions, velocities = self.policy.output(self.now())
        self.position_pub.publish(Float64MultiArray(data=positions))
        self.velocity_pub.publish(Float64MultiArray(data=velocities))
        for name, value in self.sensors.items():
            self.sensor_pubs[name].publish(Bool(data=value))


def main():
    rclpy.init()
    node = Gateway()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, ExternalShutdownException):
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()
