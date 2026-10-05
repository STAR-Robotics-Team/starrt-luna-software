cmake_minimum_required(VERSION 3.8)
project(luna_drivetrain)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(ctre_phoenix5_vendor REQUIRED)

add_executable(motor_test src/motor_test.cpp)
target_include_directories(motor_test PRIVATE include)
target_link_libraries(motor_test ctre_phoenix5_vendor::phoenix5)

install(TARGETS motor_test DESTINATION lib/${PROJECT_NAME})

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # Files carry no copyright header because the repository LICENSE covers them,
  # so skip ament_copyright and run cpplint without its copyright check.
  list(APPEND AMENT_LINT_AUTO_EXCLUDE ament_cmake_copyright ament_cmake_cpplint)
  ament_lint_auto_find_test_dependencies()
  ament_cpplint(FILTERS "-legal/copyright")
endif()

ament_package()
