// Publishes the operator heartbeat: a std_msgs/Header stamped with the time it is sent,
// on /operator/heartbeat at heartbeat_rate (10 Hz by default). The mode manager disables
// the robot when heartbeats stop arriving (teleoperation design, deliverable 5.4). In
// stub runs, this node stands in for the operator frontend's heartbeat.

#include <chrono>
#include <memory>

#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/header.hpp"

class HeartbeatPublisher : public rclcpp::Node
{
public:
  HeartbeatPublisher()
  : Node("heartbeat_publisher")
  {
    const double rate = declare_parameter("heartbeat_rate", 10.0);
    // Best effort, depth 1, as the interface table says: a late heartbeat is useless,
    // so it is never queued or sent again.
    publisher_ = create_publisher<std_msgs::msg::Header>(
      "/operator/heartbeat", rclcpp::QoS(1).best_effort());
    timer_ = create_wall_timer(
      std::chrono::duration<double>(1.0 / rate), [this]() {publish_heartbeat();});
  }

private:
  void publish_heartbeat()
  {
    std_msgs::msg::Header heartbeat;
    heartbeat.stamp = now();
    publisher_->publish(heartbeat);
  }

  rclcpp::Publisher<std_msgs::msg::Header>::SharedPtr publisher_;
  rclcpp::TimerBase::SharedPtr timer_;
};

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<HeartbeatPublisher>());
  rclcpp::shutdown();
  return 0;
}
