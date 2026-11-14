cmake_minimum_required(VERSION 3.8)
project(luna_teleop)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(std_msgs REQUIRED)

add_executable(heartbeat_publisher src/heartbeat_publisher.cpp)
ament_target_dependencies(heartbeat_publisher rclcpp std_msgs)

install(TARGETS heartbeat_publisher DESTINATION lib/${PROJECT_NAME})

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # Files carry no copyright header because the repository LICENSE covers them,
  # so skip ament_copyright and run cpplint without its copyright check.
  list(APPEND AMENT_LINT_AUTO_EXCLUDE ament_cmake_copyright ament_cmake_cpplint)
  ament_lint_auto_find_test_dependencies()
  ament_cpplint(FILTERS "-legal/copyright")
endif()

ament_package()
