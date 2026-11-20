"""Launch a standalone synthetic mechanism, never real robot hardware."""

from pathlib import Path

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    share = Path(get_package_share_directory('luna_mechanism'))
    description = (share / 'urdf/mechanism_sandbox.urdf').read_text()
    params = {'robot_description': ParameterValue(description, value_type=str)}
    nodes = [
        DeclareLaunchArgument('rviz', default_value='false'),
        Node(package='robot_state_publisher', executable='robot_state_publisher',
             namespace='mechanism_sim', parameters=[params],
             remappings=[('joint_states', 'joint_state_broadcaster/joint_states')]),
        Node(package='controller_manager', executable='ros2_control_node',
             namespace='mechanism_sim', parameters=[str(share / 'config/controllers.yaml')],
             remappings=[('robot_description', '/mechanism_sim/robot_description')]),
        Node(package='luna_mechanism', executable='mechanism_stub_gateway',
             namespace='mechanism_sim', parameters=[params]),
        Node(package='rviz2', executable='rviz2', condition=IfCondition(
            LaunchConfiguration('rviz')), arguments=['-d', str(share / 'config/stub.rviz')]),
    ]
    for controller in ('joint_state_broadcaster', 'position_controller',
                       'velocity_controller'):
        nodes.append(Node(
            package='controller_manager', executable='spawner',
            arguments=[controller, '--controller-manager',
                       '/mechanism_sim/controller_manager', '--controller-manager-timeout', '30',
                       '--param-file', str(share / 'config/controllers.yaml')]))
    return LaunchDescription(nodes)
