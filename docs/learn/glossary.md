# Glossary

Plain-language definitions of the words used in these docs, in alphabetical order. Each
one links to the page that explains it properly.

- **Absolute path:** a path that starts at the top of the file system, `/`, so it works
  from any folder. [The command line](command-line.md#folders-and-paths)
- **Action:** a long job one ROS node asks another to do, with a **goal**, **feedback**
  while it runs, and a **result** at the end. It can be canceled. [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Arena (Artemis Arena):** the walled bin of regolith simulant, about 6.88 m by 5 m,
  where the robot competes. [The arena and a run](../competition/arena-and-runs.md)
- **Argument:** a word you add after a command to tell it what to work on.
  [The command line](command-line.md#commands-options-and-arguments)
- **arm64:** a type of computer processor, used by the robot's Jetson and by Apple Silicon
  Macs. [Building for the robot](../building-for-the-robot.md)
- **Autonomy:** the robot doing its work by itself, with no human at the controls. It earns
  the most points in the competition. [How scoring works](../competition/scoring.md#7-autonomy)
- **Bag:** a recording of the messages on chosen ROS topics, made with `ros2 bag record`
  and played back with `ros2 bag play`.
  [Seeing inside a running robot](ros2-tools.md#record-and-replay-with-ros2-bag)
- **Bandwidth:** how much data flows over a network link each second, measured in Mbit/s.
  The competition scores the robot's link on it. [How scoring works](../competition/scoring.md#4-bandwidth)
- **Berm:** a long, low mound of regolith. Building one is the robot's job in the
  competition. [The Lunabotics competition](../competition/README.md)
- **Berm multiplier:** the factor that shrinks autonomy points when the berm is under
  25 liters. [How scoring works](../competition/scoring.md#the-berm-multiplier)
- **BP-1 (Black Point-1):** the crushed basalt that fills the arena in place of Moon
  regolith. [The arena and a run](../competition/arena-and-runs.md#the-regolith)
- **Branch:** a separate line of work in a Git repository. You make each change on your
  own branch. [Git and GitHub](git-and-github.md#the-main-ideas)
- **Build:** turning source code into programs that can run, done with `colcon build`.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Callback:** a function you hand over to be run later, when something happens, such
  as a timer firing or a message arriving. [Write your first node](ros2-first-node.md#what-each-part-does)
- **CAN bus:** the wiring that lets the robot's computer talk to its motor controllers.
  [CAN bus](../can-bus.md)
- **CANable:** the USB adapter that connects a computer to the CAN bus.
  [CAN bus](../can-bus.md)
- **Citation:** a link from a fact in the docs to the source it comes from, down to the
  page or section. [Writing docs](../writing-docs.md#cite-sources)
- **Class:** in C++, a blueprint that bundles data with the functions that use it. A ROS
  node is a class. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Client:** the node that sends a request to a service, or a goal to an action.
  [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Clone:** your own full copy of a Git repository, on your computer.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **colcon:** the tool that builds every package in a ROS workspace.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Command line:** using a computer by typing commands into a terminal.
  [The command line](command-line.md)
- **Commit:** a saved snapshot of changes in Git, with a message saying what changed.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Compile:** translate source code, such as C++, into a program the computer can run.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Construction run:** one of a team's two scored 15-minute runs in the arena.
  [The Lunabotics competition](../competition/README.md#competition-week)
- **Construction zone:** the corner of the arena where the robot builds the berm.
  [The arena and a run](../competition/arena-and-runs.md#the-arenas-layout)
- **Constructor:** the part of a C++ class that runs once, when an object of the class is
  made. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Container:** a running, separate environment made from an image, like a lightweight
  computer inside yours. [Containers](containers.md)
- **CTRE Phoenix:** the library from CTRE, the company that makes our motor controllers,
  that our code uses to drive them. [CAN bus](../can-bus.md)
- **Dev container:** the container the team writes and runs code in, with Ubuntu 24.04,
  ROS 2, and every tool already installed. [Containers](containers.md#the-dev-container)
- **Directory:** another word for a folder.
  [The command line](command-line.md#folders-and-paths)
- **Docker:** the program that builds images and runs containers.
  [Containers](containers.md)
- **Docker Desktop:** the app that runs Docker on Windows and macOS.
  [Getting started](../getting-started.md#1-install-the-tools)
- **Dockerfile:** the step-by-step recipe for building an image.
  [Containers](containers.md)
- **Environment variable:** a named setting that the shell gives to the programs it runs,
  such as `HOME`. [The command line](command-line.md#environment-variables)
- **E-stop:** the big red emergency stop button on top of the robot. One push cuts the
  battery off from everything that moves, and it stays pressed until someone resets it.
  [Rules the robot must follow](../competition/robot-rules.md#the-emergency-stop)
- **Energy logger:** the meter on the robot that records how much energy it used in a
  run. [Rules the robot must follow](../competition/robot-rules.md#power-and-the-energy-logger)
- **Excavation zone:** the part of the arena where the robot may dig.
  [The arena and a run](../competition/arena-and-runs.md#the-arenas-layout)
- **Executable:** a program a package provides, started with `ros2 run`.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Fake motor controllers:** a test stand-in for the motor controllers only. Our own
  hardware code runs as it will on the robot, but talks to pretend motor controllers that
  record every command and answer with scripted feedback. [Testing layers](../design/testing-layers.md#stand-ins)
- **Feedback:** the progress reports an action server sends while it works on a goal.
  [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Fingerprint (SHA-256):** a code computed from every byte of a file. If the file
  changes at all, so does its fingerprint. [Writing docs](../writing-docs.md#cite-sources)
- **Fixed frame:** the frame RViz draws everything relative to.
  [Frames, tf2, and RViz](ros2-frames-and-rviz.md#try-it-see-the-frames-in-rviz)
- **Frame:** a starting point for measuring positions, with its own x, y, and z
  directions, such as the robot's center, `base_link`.
  [Frames, tf2, and RViz](ros2-frames-and-rviz.md#where-always-means-relative-to-what)
- **Git:** the tool that tracks every change to the code.
  [Git and GitHub](git-and-github.md)
- **GitHub:** the website that stores the team's shared repository and where changes are
  reviewed. [Git and GitHub](git-and-github.md)
- **Goal:** the job an action client asks an action server to do. [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Hands-free:** nobody touching the controls, so the robot is working autonomously.
  [How scoring works](../competition/scoring.md#the-cycle-segments)
- **Hardware line:** the contract between a hardware system and the code above it, such
  as its topics or joints. Every stand-in and the real driver must meet it, so the code
  above runs the same in every test.
  [Testing layers](../design/testing-layers.md#the-hardware-line)
- **Heartbeat:** a small message the operator laptop sends many times a second so the
  robot knows the link is alive. If it stops arriving, the robot stops.
  [Operating modes](../design/operating-modes.md)
- **Home folder:** your own folder of files, such as `/home/ada`; `~` is a shortcut for
  it. [The command line](command-line.md#folders-and-paths)
- **Host:** your own computer, as opposed to a container running on it.
  [Containers](containers.md)
- **Image:** a frozen, ready-made setup that containers are made from, like a blueprint.
  [Containers](containers.md)
- **Jetson:** the NVIDIA computer on the robot that runs its software.
  [Building for the robot](../building-for-the-robot.md)
- **Lambda:** in C++, a small function without a name, written right where it is needed,
  often as a callback. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Launch file:** a file that starts several ROS nodes at once, with their settings.
  [Launch files and parameter files](ros2-launch-files.md#write-a-launch-file)
- **Lidar:** a sensor that measures distances by sweeping a laser around.
  [The arena and a run](../competition/arena-and-runs.md#the-regolith)
- **`localhost`:** a name that always means "this computer".
  [Containers](containers.md#two-more-ideas-you-will-meet)
- **Log level:** how serious a log message is: `DEBUG`, `INFO`, `WARN`, `ERROR`, or
  `FATAL`. [Seeing inside a running robot](ros2-tools.md#log-messages-and-rqt_console)
- **Log message:** a line a node prints about what it is doing. Every node also sends its
  log messages on the `/rosout` topic. [Seeing inside a running robot](ros2-tools.md#log-messages-and-rqt_console)
- **`main`:** the team's official branch, the version that runs on the robot.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Markdown:** the simple text format these docs are written in.
  [Your first pull request](first-pull-request.md#3-make-your-change)
- **Merge:** adding a branch's commits to another branch, usually `main`, after review.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Message:** one piece of data sent on a ROS topic. Its **message type** fixes what it
  contains. [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Mission Control Center (MCC):** the room the team runs the robot from during a run,
  out of sight of the arena. [The arena and a run](../competition/arena-and-runs.md#mission-control)
- **Mission cycle:** the robot's repeating job: dig, carry the regolith across the
  obstacles, dump it on the berm, and drive back.
  [The Lunabotics competition](../competition/README.md#what-the-robot-does)
- **Motor controller:** a hardware box, such as a Talon SRX, that sets how much power a
  motor gets when the computer tells it to. Not the same as a ros2_control controller.
  [CAN bus](../can-bus.md)
- **Mount:** sharing a folder from your computer into a container. The dev container
  mounts your clone at `/ws`, so both see the same files.
  [Containers](containers.md#mounting-how-your-files-get-into-the-container)
- **Node:** one program in a ROS system. [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Obstacle zone:** the part of the arena between digging and building, with rocks,
  craters, and a column. [The arena and a run](../competition/arena-and-runs.md#obstacles)
- **Odometry:** working out how far a robot has moved from its own motion, such as how far
  its wheels have turned. [Frames, tf2, and RViz](ros2-frames-and-rviz.md#standard-frames-for-a-mobile-robot)
- **Operating mode:** what the robot is allowed to do right now, such as DISABLED, or
  ENABLED and driving between zones. [Operating modes](../design/operating-modes.md)
- **Option:** a word starting with `-` or `--` that changes how a command works; also
  called a flag. [The command line](command-line.md#commands-options-and-arguments)
- **`origin`:** Git's name for the copy of the repository on GitHub.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Overlay:** a workspace loaded on top of others in a terminal, by sourcing its
  `install/setup.bash`. `ros2 run` looks in it first.
  [Write your first node](ros2-first-node.md#build-and-run)
- **Package:** a folder of ROS code that is built as one unit.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Parameter:** a setting a ROS node reads when it starts, such as a maximum speed.
  [Services, actions, and parameters](ros2-services-actions-parameters.md#try-it-change-a-parameter)
- **Parameter file:** a YAML file of parameter values that a node reads when it starts.
  [Launch files and parameter files](ros2-launch-files.md#put-the-parameters-in-a-file)
- **Path:** a file's address, the folders you go through to reach it.
  [The command line](command-line.md#folders-and-paths)
- **Port:** a numbered door that a network program listens on, like an apartment number.
  [Containers](containers.md#two-more-ideas-you-will-meet)
- **Power budget:** the spreadsheet that adds up how much current and energy each part of
  the robot uses in each operating mode, to size the battery, breakers, and wires.
  [Operating modes](../design/operating-modes.md)
- **Primary source:** a document from whoever makes the part or sets the rule, such as a
  datasheet or the competition guidebook. It is the source of truth for that fact.
  [Sources](../sources.md)
- **Prompt:** the text a terminal shows when it is ready for your next command.
  [The command line](command-line.md#your-first-commands)
- **Publish:** send messages on a ROS topic. The opposite is **subscribe**.
  [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Pull:** bring other people's commits from GitHub to your computer.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Pull request (PR):** a request to merge your branch into `main`, which teammates
  review first. [Your first pull request](first-pull-request.md)
- **Push:** send your commits from your computer to GitHub.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **QoS (quality of service):** settings that say how a topic's messages are delivered,
  such as how many to keep for a subscriber that falls behind. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Quaternion:** four numbers that ROS uses to store a rotation.
  [Frames, tf2, and RViz](ros2-frames-and-rviz.md#try-it-publish-frames)
- **Rebuild (a container):** build the dev container's image again after its setup in
  `.devcontainer/` changes. [Containers](containers.md#two-more-ideas-you-will-meet)
- **Regolith:** the loose dust and rock covering the Moon's surface. A **regolith
  simulant** is an Earth material that imitates it.
  [The Lunabotics competition](../competition/README.md#why-nasa-wants-robots-that-build-berms)
- **Relative path:** a path that starts from the folder you are in.
  [The command line](command-line.md#folders-and-paths)
- **Remapping:** renaming a topic for one node when it starts, without changing its code.
  [Launch files and parameter files](ros2-launch-files.md#try-it-remap-a-topic)
- **Repository (repo):** a project folder that Git tracks, with its full history.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Request:** what a service client sends to a server, which answers with a
  **response**. [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Result:** what an action server sends back when it finishes a goal. [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **ROS 2:** Robot Operating System 2, the framework that lets the robot's programs talk
  to each other. [ROS 2 basics](ros2-basics.md)
- **ros2_control controller:** software in ros2_control, such as `diff_drive_controller`,
  that turns a command like "drive forward at 0.5 m/s" into a command for each joint.
  Not the same as a motor controller.
  [Testing layers](../design/testing-layers.md#testing-layers)
- **rosdep:** the tool that installs the system software each package says it needs. Our
  `scripts/install_deps.sh` runs it. [Everyday workflow](../everyday-workflow.md#what-to-do-after-a-change)
- **rqt:** a set of small ROS tools with windows, such as `rqt_graph` and `rqt_console`.
  [Seeing inside a running robot](ros2-tools.md#log-messages-and-rqt_console)
- **RViz:** the ROS tool that shows frames, sensor data, maps, and paths in 3D.
  [Frames, tf2, and RViz](ros2-frames-and-rviz.md#try-it-see-the-frames-in-rviz)
- **Script:** a file of commands saved so they can be run again.
  [The command line](command-line.md#running-scripts-and-programs)
- **Secondary source:** a document that repeats or summarizes a primary source, such as a
  reseller's product page. Use it only when no primary source covers the fact.
  [Sources](../sources.md)
- **Server:** the node that offers a service or an action, and answers requests or goals.
  [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Service:** a request from one ROS node to another, with one response, such as
  "enable the robot". [Services, actions, and parameters](ros2-services-actions-parameters.md#three-ways-to-talk)
- **Shared pointer (`SharedPtr`):** a handle to a C++ object, which stays alive as long as
  something holds a handle to it. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Shell:** the program inside a terminal that reads and runs your commands, such as
  `bash`. [The command line](command-line.md#what-a-terminal-is)
- **SocketCAN:** the CAN bus support built into Linux. [CAN bus](../can-bus.md)
- **Source (a file):** run a setup file's commands in the current terminal, so the
  settings it makes stay. [ROS 2 basics](ros2-basics.md#sourcing-why-you-sometimes-open-a-new-terminal)
- **Spin:** `rclcpp::spin` hands control of a node to ROS, which runs its callbacks as
  events arrive, until you press Ctrl+C. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Staging:** choosing which changes go into your next Git commit, with `git add`.
  [Git and GitHub](git-and-github.md#save-a-snapshot-git-add-and-git-commit)
- **Stand-in:** anything that takes the place of a real device in a test, such as a stub,
  fake motor controllers, a recording, or Gazebo. [Testing layers](../design/testing-layers.md#stand-ins)
- **Starting zone:** the 2 m by 2 m corner of the arena where the robot begins each run.
  [The arena and a run](../competition/arena-and-runs.md#the-arenas-layout)
- **Stub:** a stand-in for everything below a system's hardware line, so none of that
  system's own hardware code runs: ros2_control's ready-made stub for things that move,
  or a small node that publishes made-up data for a sensor. [Testing layers](../design/testing-layers.md#stand-ins)
- **Subscribe:** receive messages from a ROS topic.
  [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **`sudo`:** run a command as an administrator.
  [The command line](command-line.md#running-scripts-and-programs)
- **TBD (to be determined):** marks something in the docs that is not decided or not
  known yet. [Writing docs](../writing-docs.md#mark-what-is-not-settled)
- **TBR (to be resolved):** marks something in the docs that is written down but not
  confirmed yet, such as a proposal or a value nobody has tested.
  [Writing docs](../writing-docs.md#mark-what-is-not-settled)
- **Teleoperation:** driving the robot remotely, from Mission Control.
  [The Lunabotics competition](../competition/README.md#what-the-robot-does)
- **Terminal:** a window where you type commands. [The command line](command-line.md)
- **tf2:** the ROS library that keeps track of every frame, and works out where any frame is
  relative to another. [Frames, tf2, and RViz](ros2-frames-and-rviz.md#standard-frames-for-a-mobile-robot)
- **Timer:** makes a node run a callback again and again, at a fixed interval. [Write your first node](ros2-first-node.md#what-each-part-does)
- **Topic:** a named channel that ROS nodes send messages on, such as `/cmd_vel`.
  [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Transform:** how to get from one frame to another: how far to move, and how far to
  turn. [Frames, tf2, and RViz](ros2-frames-and-rviz.md#where-always-means-relative-to-what)
- **Twist:** the standard ROS message for "move at this speed", with forward and turning
  velocities. [ROS 2 basics](ros2-basics.md#try-it-drive-a-turtle)
- **Underlay:** a workspace that an overlay is loaded on top of.
  [Write your first node](ros2-first-node.md#build-and-run)
- **URDF:** a file that describes a robot's parts and where they are attached, which
  provides the frames of its body and sensors. [Frames, tf2, and RViz](ros2-frames-and-rviz.md#frames-on-the-rover)
- **VNC:** remote-desktop technology. The dev container runs a desktop you view over VNC.
  [GUI tools](../gui-tools.md)
- **VS Code:** the code editor most of the team uses.
  [Getting started](../getting-started.md#1-install-the-tools)
- **Watt-hour (Wh):** a unit of energy: 1 watt used for 1 hour.
  [How scoring works](../competition/scoring.md#3-berm-productivity-per-watt-hour)
- **Wireless access point (WAP):** the Wi-Fi router that links Mission Control to the
  robot. [The arena and a run](../competition/arena-and-runs.md#how-the-robot-talks-to-mission-control)
- **Working directory:** the folder a terminal is currently in.
  [The command line](command-line.md#folders-and-paths)
- **Workspace:** a folder of ROS packages that are built together; our repository is one.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **WSL:** Windows Subsystem for Linux, which runs Ubuntu inside Windows.
  [The command line](command-line.md#open-a-terminal)
- **x86-64:** the type of processor in most laptops.
  [Building for the robot](../building-for-the-robot.md)
- **YAML:** a plain-text format for settings, in which the spaces at the start of each
  line decide what belongs to what. Parameter files use it.
  [Launch files and parameter files](ros2-launch-files.md#put-the-parameters-in-a-file)
