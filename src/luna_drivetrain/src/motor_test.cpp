// Motor bench test carried over from last semester's lunabotics-motor-control
// repo. Drives the left Talon SRX and Victor SPX at 10% output on can0 until
// stopped with Ctrl+C. The controllers disable themselves within 100 ms of the
// program stopping, because the enable signal is only fed 100 ms at a time.
//
// This is not a ROS node yet. Turning it into one is deliverable 3.2.

#include <chrono>
#include <string>
#include <thread>

#include "ctre/Phoenix.h"
#include "ctre/phoenix/unmanaged/Unmanaged.h"

#include "luna_drivetrain/can_ids.hpp"

using ctre::phoenix::motorcontrol::ControlMode;
using ctre::phoenix::motorcontrol::can::TalonSRX;
using ctre::phoenix::motorcontrol::can::VictorSPX;

namespace
{

// Positive turn turns the robot left.
void drive(TalonSRX & talon_left, VictorSPX & victor_left, double forward, double turn)
{
  const double left = forward - turn;
  talon_left.Set(ControlMode::PercentOutput, left);
  victor_left.Set(ControlMode::PercentOutput, left);
}

}  // namespace

int main()
{
  const std::string interface = "can0";
  TalonSRX talon_left{luna_drivetrain::kTalonLeftCanId, interface};
  VictorSPX victor_left{luna_drivetrain::kVictorLeftCanId, interface};

  // drive() also commands the Victor directly, which replaces this follower
  // mode. Deliverable 3.1 decides which controllers lead and which follow.
  victor_left.Set(ControlMode::Follower, luna_drivetrain::kTalonLeftCanId);

  while (true) {
    ctre::phoenix::unmanaged::Unmanaged::FeedEnable(100);
    drive(talon_left, victor_left, 0.1, 0.0);
    std::this_thread::sleep_for(std::chrono::milliseconds(20));
  }
}
