# Packages, nodes, and libraries

How to add code to the team's workspace: a new package, a new node in a package that
already exists, or a library such as a ros2_control hardware plugin. It also shows how to
see what `colcon test` checks. It assumes you have built the practice package in
[Write your first node](learn/ros2-first-node.md), which works the same way.

## Which one you need

| You want to | Section |
| --- | --- |
| Start a subsystem that has no package yet | [Create a package](#create-a-package) |
| Use code from another package, such as `rclcpp` or a message type | [Use another package](#use-another-package) |
| Add a program to a package that exists | [Add a node to a package](#add-a-node-to-a-package) |
| Write code that the controller manager loads, such as a hardware plugin or a controller | [Add a plugin library](#add-a-plugin-library) |
| See what the tests check, and fix a style failure | [See what the tests check](#see-what-the-tests-check) |

Each subsystem has one package ([Contributing, Packages](contributing.md#packages)). The
platform design lists them all, with the deliverables that write each one
([platform design, section 5](design/platform.md#5-libraries-and-hardware-interfaces)).

## Create a package

1. Start a branch from the latest `main`. Name it after your workstream and what you are
   adding:

    ```bash title="Your terminal or the dev container"
    git switch main
    git pull
    git switch -c mechanism/stub-controller
    ```

2. Create the package in `src/`, from the workspace's top folder:

    ```bash title="Dev container"
    cd src
    ros2 pkg create luna_mechanism --build-type ament_cmake --license Apache-2.0 --dependencies rclcpp
    ```

    **Put the package's name before `--dependencies`.** `--dependencies` takes every word
    after it, so with the name last, the command takes the name as a dependency and fails:

    ```text title="Output"
    ros2 pkg create: error: the following arguments are required: package_name
    ```

    **Leave out `--node-name` and `--library-name`.** They write example code with
    `ament_target_dependencies`, an older way to do what
    [Use another package](#use-another-package) shows, and the team does not use it.

3. Delete the package's `LICENSE` file. The repository's own `LICENSE` covers every
   package.

    ```bash title="Dev container"
    rm luna_mechanism/LICENSE
    ```

4. In `package.xml`, replace `TODO: Package description` with a sentence on what the
   package does, and the `ubuntu@todo.todo` maintainer with your name and email.

5. In `CMakeLists.txt`, replace the `if(BUILD_TESTING)` block with the team's:

    ```cmake title="src/luna_mechanism/CMakeLists.txt"
    if(BUILD_TESTING)
      find_package(ament_lint_auto REQUIRED)
      # Files carry no copyright header because the repository LICENSE covers them,
      # so skip ament_copyright and run cpplint without its copyright check.
      list(APPEND AMENT_LINT_AUTO_EXCLUDE ament_cmake_copyright ament_cmake_cpplint)
      ament_lint_auto_find_test_dependencies()
      ament_cpplint(FILTERS "-legal/copyright")
    endif()
    ```

    The template's block turns off two checks: the copyright check, and **cpplint**, a C++
    style check. The team's block turns off only the copyright check, so cpplint still
    runs. [See what the tests check](#see-what-the-tests-check) lists them all.

6. Build and test the new package. It has no code yet, so the build only checks that the
   package is set up right:

    ```bash title="Your terminal"
    scripts/dev build --packages-select luna_mechanism
    scripts/dev test --packages-select luna_mechanism
    ```

A package with no code is ready for its first node, as the next sections show.

## Use another package

Code from another package takes three lines in two files. Here is why. The heartbeat
publisher in `src/luna_teleop` starts with:

```cpp title="src/luna_teleop/src/heartbeat_publisher.cpp"
#include "rclcpp/rclcpp.hpp"
```

That file is not in our repository. In the dev container it is in
`/opt/ros/jazzy/include/rclcpp/`, and rclcpp's compiled code is in
`/opt/ros/jazzy/lib/librclcpp.so`. To build the heartbeat publisher, the compiler needs
the first path and the **linker**, which joins our code to rclcpp's, needs the second.
Nothing tells them by default. These three lines do, in this order:

1. **`package.xml` says the package needs rclcpp.** This line is for ROS's tools, not the
   compiler: **rosdep** installs rclcpp if it is missing, and **colcon** builds it before
   this package. CMake never reads `package.xml`.

    ```xml title="src/luna_teleop/package.xml"
    <depend>rclcpp</depend>
    ```

2. **`find_package` finds it.** CMake looks for rclcpp on the computer, reads the file
   rclcpp ships with, and learns where its headers and library are. It bundles them under
   one name, `rclcpp::rclcpp`, but gives them to no program yet.

    ```cmake title="src/luna_teleop/CMakeLists.txt"
    find_package(rclcpp REQUIRED)
    ```

3. **`target_link_libraries` gives it to one program.** The heartbeat publisher's code
   now compiles against rclcpp's headers and links to its library.

    ```cmake title="src/luna_teleop/CMakeLists.txt"
    target_link_libraries(heartbeat_publisher
      rclcpp::rclcpp ${std_msgs_TARGETS})
    ```

**Why `find_package` and `target_link_libraries` are separate:** a package can build
several programs, and each one gets only what it uses. So `find_package` appears once for
each package you use, and `target_link_libraries` once for each program.

**The bundle's name** is usually `<package>::<package>`, as with `rclcpp::rclcpp`. A
message package, such as `std_msgs`, gives a list instead, `${std_msgs_TARGETS}`. A few
packages pick their own name, such as `ctre_phoenix5_vendor::phoenix5` in
`src/luna_drivetrain/CMakeLists.txt`; the package's examples show it.

**What each line's absence looks like,** so you can recognize it:

- **No `target_link_libraries`:** the compiler cannot find the header.

    ```text title="Output"
    heartbeat_publisher.cpp:9:10: fatal error: rclcpp/rclcpp.hpp: No such file or directory
    ```

- **No `find_package`:** CMake stops before compiling anything.

    ```text title="Output"
    CMake Error at CMakeLists.txt:13 (target_link_libraries):
      Target "heartbeat_publisher" links to:

        rclcpp::rclcpp

      but the target was not found.
    ```

- **No `<depend>`:** nothing fails on your computer if the package is already installed.
  It fails on the next computer, because rosdep only installs what `package.xml` lists.
  To see what rosdep would install for the whole workspace:

    ```bash title="Dev container"
    rosdep check --from-paths src --ignore-src
    ```

    It prints `All system dependencies have been satisfied`, or lists what is missing.

**After you add a `<depend>`,** install it, then build
([Everyday workflow, What to do after a change](everyday-workflow.md#what-to-do-after-a-change)):

```bash title="Your terminal"
scripts/dev run bash scripts/install_deps.sh
```

## Add a node to a package

This example adds `teleop_node` to `luna_teleop`, beside the heartbeat publisher. It reads
`/joy`, a `sensor_msgs/msg/Joy` message, and publishes `/teleop/cmd_vel`, a
`geometry_msgs/msg/TwistStamped`
([teleoperation design, section 3](design/teleoperation.md#3-interfaces)). So its code
uses two packages the heartbeat publisher does not: `sensor_msgs` and `geometry_msgs`.

1. Write the node in `src/luna_teleop/src/teleop_node.cpp`.
2. Add the two new packages to `package.xml`. Lines starting with `+` are new:

    ```diff title="src/luna_teleop/package.xml"
       <depend>rclcpp</depend>
       <depend>std_msgs</depend>
    +  <depend>sensor_msgs</depend>
    +  <depend>geometry_msgs</depend>
    ```

3. In `CMakeLists.txt`, find the two new packages, build the node, and install it:

    ```diff title="src/luna_teleop/CMakeLists.txt"
     find_package(rclcpp REQUIRED)
     find_package(std_msgs REQUIRED)
    +find_package(sensor_msgs REQUIRED)
    +find_package(geometry_msgs REQUIRED)

     add_executable(heartbeat_publisher src/heartbeat_publisher.cpp)
     target_link_libraries(heartbeat_publisher
       rclcpp::rclcpp ${std_msgs_TARGETS})
    +
    +add_executable(teleop_node src/teleop_node.cpp)
    +target_link_libraries(teleop_node
    +  rclcpp::rclcpp ${sensor_msgs_TARGETS} ${geometry_msgs_TARGETS})

    -install(TARGETS heartbeat_publisher DESTINATION lib/${PROJECT_NAME})
    +install(TARGETS heartbeat_publisher teleop_node
    +  DESTINATION lib/${PROJECT_NAME})
    ```

    - `add_executable` builds a program, named first, from the C++ file after it.
    - `target_link_libraries` gives it only what it uses. The heartbeat publisher's line
      does not change: it still uses only rclcpp and std_msgs.
    - `install` copies both programs to `install/luna_teleop/lib/luna_teleop/`, where
      `ros2 run` looks for them.

4. Install the new dependencies, build, and run the node:

    ```bash title="Your terminal"
    scripts/dev run bash scripts/install_deps.sh
    scripts/dev build --packages-select luna_teleop
    scripts/dev run ros2 run luna_teleop teleop_node
    ```

**If you forget `install`,** the build still succeeds, but `ros2 run` cannot find the
program:

```text title="Output"
No executable found
```

A copy left in `install/` by an earlier build can hide this on your own computer, so the
mistake shows up later, on someone else's.

## Add a plugin library

Some code is not a program you start with `ros2 run`. **A plugin** is a library that
another program loads while it runs, by a name written in a file. ros2_control works this
way:

- **The controller manager owns the control loop.** On every cycle, it reads from each
  hardware component, updates each controller, and writes the controllers' outputs back to
  the hardware
  ([ros2_control: Getting Started, section "Controller Manager"](sources.md#ros2-control-getting-started)).
  Those reads and writes are the hardware plugin's `read()` and `write()`.
- **It loads each hardware component as a plugin**
  ([ros2_control: Writing a Hardware Component](sources.md#ros2-control-writing-hardware)),
  by the name in the robot model's `ros2_control` tag
  ([ros2_control: Getting Started, section "Hardware Description in URDF"](sources.md#ros2-control-getting-started)).
  Controllers are loaded the same way
  ([ros2_control: Getting Started, section "Controllers"](sources.md#ros2-control-getting-started)).

So the drive hardware plugin has no `main()`. And switching between the stub hardware,
Gazebo, and the real motor controllers changes only that one name in the robot model
([testing layers](design/testing-layers.md)).

This example is the drive hardware plugin in `luna_drivetrain` (deliverable 3.5). The
mechanism's hardware plugin works the same way. The code below builds, passes the style
checks, and loads in the controller manager. It follows the shape of ros2_control's Jazzy
example robot, DiffBot
([ros2_control_demos example 2, diffbot_system.hpp](sources.md#ros2-control-demo-2-header);
[its CMakeLists.txt](sources.md#ros2-control-demo-2-cmake)).

1. **Dependencies.** `src/luna_drivetrain/package.xml` already lists what the plugin
   needs: `hardware_interface`, `pluginlib`, `rclcpp`, and `rclcpp_lifecycle`. It also
   lists the controller manager and the stock controllers that run with it. If
   `ros2 pkg prefix hardware_interface` says `Package not found` in your dev container,
   run `scripts/dev run bash scripts/install_deps.sh`.

2. **The class.** A **system** is one hardware component that owns several joints: here,
   the four wheels and the drive mode's GPIO interfaces. Declare it in a header:

    ```cpp title="src/luna_drivetrain/include/luna_drivetrain/drive_system_hardware.hpp"
    #ifndef LUNA_DRIVETRAIN__DRIVE_SYSTEM_HARDWARE_HPP_
    #define LUNA_DRIVETRAIN__DRIVE_SYSTEM_HARDWARE_HPP_

    #include "hardware_interface/system_interface.hpp"
    #include "rclcpp/rclcpp.hpp"
    #include "rclcpp_lifecycle/state.hpp"

    namespace luna_drivetrain
    {

    class DriveSystemHardware : public hardware_interface::SystemInterface
    {
    public:
      hardware_interface::CallbackReturn on_init(
        const hardware_interface::HardwareComponentInterfaceParams & params) override;
      hardware_interface::CallbackReturn on_activate(
        const rclcpp_lifecycle::State & previous_state) override;
      hardware_interface::CallbackReturn on_deactivate(
        const rclcpp_lifecycle::State & previous_state) override;
      hardware_interface::return_type read(
        const rclcpp::Time & time, const rclcpp::Duration & period) override;
      hardware_interface::return_type write(
        const rclcpp::Time & time, const rclcpp::Duration & period) override;
    };

    }  // namespace luna_drivetrain

    #endif  // LUNA_DRIVETRAIN__DRIVE_SYSTEM_HARDWARE_HPP_
    ```

3. **What each function is for.** The controller manager calls them; you never do.

    | Function | When it runs | What the drive plugin does in it ([drivetrain design, section 5](design/drivetrain.md#5-libraries-and-hardware-interfaces)) |
    | --- | --- | --- |
    | `on_init` | Once, when the plugin loads | Calls the base class's `on_init` first, which reads the robot model's `ros2_control` tag. Then reads its own parameters, such as `can_interface` |
    | `on_activate` | When it starts controlling the hardware | Sets voltage compensation, brake mode, and each Victor SPX to follow its side's Talon SRX |
    | `on_deactivate` | When it stops | Sends zero |
    | `read` | Every cycle, before the controllers | Reads each wheel's velocity and position, and each motor's current |
    | `write` | Every cycle, after the controllers | While `drive_mode/enable` is 1, sends each side's output and feeds the motor controllers' enable. Otherwise sends zero |

    The `on_` functions return `hardware_interface::CallbackReturn::SUCCESS`, or `ERROR` to
    stop. `read` and `write` return `hardware_interface::return_type::OK`.

4. **The code.** Start with every function doing nothing, then fill them in:

    ```cpp title="src/luna_drivetrain/src/drive_system_hardware.cpp"
    #include "luna_drivetrain/drive_system_hardware.hpp"

    namespace luna_drivetrain
    {

    hardware_interface::CallbackReturn DriveSystemHardware::on_init(
      const hardware_interface::HardwareComponentInterfaceParams & params)
    {
      // The base class reads the robot model's ros2_control tag and makes the interfaces.
      if (hardware_interface::SystemInterface::on_init(params) !=
        hardware_interface::CallbackReturn::SUCCESS)
      {
        return hardware_interface::CallbackReturn::ERROR;
      }
      return hardware_interface::CallbackReturn::SUCCESS;
    }

    hardware_interface::CallbackReturn DriveSystemHardware::on_activate(
      const rclcpp_lifecycle::State & /*previous_state*/)
    {
      return hardware_interface::CallbackReturn::SUCCESS;
    }

    hardware_interface::CallbackReturn DriveSystemHardware::on_deactivate(
      const rclcpp_lifecycle::State & /*previous_state*/)
    {
      return hardware_interface::CallbackReturn::SUCCESS;
    }

    hardware_interface::return_type DriveSystemHardware::read(
      const rclcpp::Time & /*time*/, const rclcpp::Duration & /*period*/)
    {
      return hardware_interface::return_type::OK;
    }

    hardware_interface::return_type DriveSystemHardware::write(
      const rclcpp::Time & /*time*/, const rclcpp::Duration & /*period*/)
    {
      return hardware_interface::return_type::OK;
    }

    }  // namespace luna_drivetrain

    #include "pluginlib/class_list_macros.hpp"
    PLUGINLIB_EXPORT_CLASS(
      luna_drivetrain::DriveSystemHardware, hardware_interface::SystemInterface)
    ```

    - **The interfaces come from the robot model.** The base class makes one for each
      `command_interface` and `state_interface` in the `ros2_control` tag (step 7). Read and
      write them by name: `get_command("<wheel>/velocity")` gives the velocity a
      controller asked for, and `set_state("<wheel>/velocity", value)` reports the one you
      measured. Older tutorials, including the steps in ros2_control's own guide, write
      `export_state_interfaces()` and `export_command_interfaces()` by hand instead; the
      Jazzy example does not need them.
    - **The names commented out,** such as `/*period*/`, are parameters the function does
      not use yet. Commenting them out stops the compiler's unused-parameter warnings.
    - **`PLUGINLIB_EXPORT_CLASS`** lets pluginlib make a `DriveSystemHardware` from inside
      the library. Without it, the library builds, but nothing can load the class.

5. **The plugin's description.** pluginlib finds a plugin by reading this file, which
   matches the name in the robot model to the library and the class:

    ```xml title="src/luna_drivetrain/luna_drivetrain_plugins.xml"
    <library path="luna_drivetrain_hardware">
      <class name="luna_drivetrain/DriveSystemHardware"
             type="luna_drivetrain::DriveSystemHardware"
             base_class_type="hardware_interface::SystemInterface">
        <description>The drive hardware plugin.</description>
      </class>
    </library>
    ```

    - `path` is the library's name in `CMakeLists.txt` (step 6).
    - `name` is what the robot model writes (step 7).
    - `type` is the C++ class, and `base_class_type` is what it extends.

6. **Build it as a library.** Add these to `CMakeLists.txt`, after the `find_package`
   lines, with a `find_package` for each of the four dependencies:

    ```cmake title="src/luna_drivetrain/CMakeLists.txt"
    find_package(hardware_interface REQUIRED)
    find_package(pluginlib REQUIRED)
    find_package(rclcpp REQUIRED)
    find_package(rclcpp_lifecycle REQUIRED)

    add_library(luna_drivetrain_hardware SHARED src/drive_system_hardware.cpp)
    target_include_directories(luna_drivetrain_hardware PUBLIC
      $<BUILD_INTERFACE:${PROJECT_SOURCE_DIR}/include>
      $<INSTALL_INTERFACE:include/${PROJECT_NAME}>)
    target_link_libraries(luna_drivetrain_hardware PUBLIC
      hardware_interface::hardware_interface
      pluginlib::pluginlib
      rclcpp::rclcpp
      rclcpp_lifecycle::rclcpp_lifecycle)
    pluginlib_export_plugin_description_file(hardware_interface luna_drivetrain_plugins.xml)

    install(TARGETS luna_drivetrain_hardware
      ARCHIVE DESTINATION lib
      LIBRARY DESTINATION lib
      RUNTIME DESTINATION bin)
    install(DIRECTORY include/ DESTINATION include/${PROJECT_NAME})
    ```

    How this differs from a node:

    - **`add_library(... SHARED ...)` instead of `add_executable`.** A **shared library**
      is compiled code that a running program loads, not a program itself.
    - **`target_include_directories`** tells the compiler where the package's own headers
      are: `include/` while building, and `include/luna_drivetrain/` once installed.
    - **`pluginlib_export_plugin_description_file`** registers the description file under
      `hardware_interface`, where the controller manager looks for hardware plugins. A
      controller registers under `controller_interface` instead, as
      `diff_drive_controller` does.
    - **`install`** puts the library in `lib/`, not `lib/luna_drivetrain/` like a node,
      and installs the headers.

7. **Name it in the robot model.** The `ros2_control` tag picks the plugin and gives it
   its parameters:

    ```xml title="The robot model's ros2_control tag (deliverable 6.3)"
    <ros2_control name="DriveSystem" type="system">
      <hardware>
        <plugin>luna_drivetrain/DriveSystemHardware</plugin>
        <param name="can_interface">can0</param>
      </hardware>
      <joint name="<wheel>">
        <command_interface name="velocity"/>
        <state_interface name="velocity"/>
        <state_interface name="position"/>
      </joint>
    </ros2_control>
    ```

    Every `joint` in the tag must also be a joint in the robot model. If it is not, the
    controller manager refuses to load the plugin:

    ```text title="Output"
    Exception caught while loading and initializing components: Joint 'left_wheel_joint' not found in URDF
    ```

    When the plugin loads, the controller manager's log says so:

    ```text title="Output"
    Loaded hardware 'DriveSystem' from plugin 'luna_drivetrain/DriveSystemHardware'
    ```

8. **Test it without hardware.** The plugin talks to the motor controllers only through a
   small interface of ours, so the fake motor controllers can stand in for them in unit
   tests ([drivetrain design, section 5](design/drivetrain.md#5-libraries-and-hardware-interfaces)).
   For example: deactivating sends zero, and a wheel speed becomes the right output.

## See what the tests check

Every package made from the template, with the team's test block, runs the same checks.
To list them:

```bash title="Your terminal"
scripts/dev test --packages-select luna_teleop
scripts/dev run ctest --test-dir build/luna_teleop -N
```

```text title="Output"
Test project /ws/build/luna_teleop
  Test #1: cpplint
  Test #2: cppcheck
  Test #3: lint_cmake
  Test #4: uncrustify
  Test #5: xmllint

Total Tests: 5
```

| Test | What it checks |
| --- | --- |
| `cpplint` | C++ style rules, such as line length and the order of `#include` lines |
| `cppcheck` | C++ code for likely bugs. It is skipped: ROS skips the version in the dev container, 2.13, because it is slow, and the test log says `cppcheck 2.13.0 has known performance issues and therefore will not be used` |
| `lint_cmake` | `CMakeLists.txt` style |
| `uncrustify` | C++ formatting, in the ROS 2 style |
| `xmllint` | That `package.xml` is valid |

They come from two lines: `<test_depend>ament_lint_common</test_depend>` in `package.xml`,
and `ament_lint_auto_find_test_dependencies()` in `CMakeLists.txt`. Each check is a
**linter**, a tool that reads the code without running it.

**None of them checks what your code does.** They pass for a node that publishes on the
wrong topic, or at the wrong rate. Checking that takes tests you write yourself
[TBD: a learning guide page on unit and launch tests (2.4)]. None of these run on GitHub
yet, either [TBD: CI that builds and tests the code (2.5)].

**To see a check fail,** add a badly formatted line to the end of any `.cpp` file, such
as `int  x( ){return 0;}`, and run the tests again. You do not need to rebuild: the
linters read the source files directly.

```text title="Output"
build/luna_teleop/test_results/luna_teleop/uncrustify.xunit.xml: 1 test, 0 errors, 1 failure, 0 skipped
- luna_teleop.uncrustify src/heartbeat_publisher.cpp
  <<< failure message
    Diff with 5 lines
  >>>

Summary: 5 tests, 0 errors, 1 failure, 1 skipped
```

To fix formatting, let uncrustify rewrite the files, then run the tests again:

```bash title="Your terminal"
scripts/dev run ament_uncrustify --reformat src/luna_teleop
```
