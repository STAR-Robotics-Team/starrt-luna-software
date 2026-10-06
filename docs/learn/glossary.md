# Glossary

Plain-language definitions of the words used in these docs, in alphabetical order. Each
one links to the page that explains it properly.

- **Absolute path:** a path that starts at the top of the file system, `/`, so it works
  from any folder. [The command line](command-line.md#folders-and-paths)
- **Argument:** a word you add after a command to tell it what to work on.
  [The command line](command-line.md#commands-options-and-arguments)
- **arm64:** a type of computer processor, used by the robot's Jetson and by Apple Silicon
  Macs. [Building for the robot](../building-for-the-robot.md)
- **Branch:** a separate line of work in a Git repository. You make each change on your
  own branch. [Git and GitHub](git-and-github.md#the-main-ideas)
- **Build:** turning source code into programs that can run, done with `colcon build`.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **CAN bus:** the wiring that lets the robot's computer talk to its motor controllers.
  [CAN bus](../can-bus.md)
- **CANable:** the USB adapter that connects a computer to the CAN bus.
  [CAN bus](../can-bus.md)
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
- **Executable:** a program a package provides, started with `ros2 run`.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Git:** the tool that tracks every change to the code.
  [Git and GitHub](git-and-github.md)
- **GitHub:** the website that stores the team's shared repository and where changes are
  reviewed. [Git and GitHub](git-and-github.md)
- **Home folder:** your own folder of files, such as `/home/ada`; `~` is a shortcut for
  it. [The command line](command-line.md#folders-and-paths)
- **Host:** your own computer, as opposed to a container running on it.
  [Containers](containers.md)
- **Image:** a frozen, ready-made setup that containers are made from, like a blueprint.
  [Containers](containers.md)
- **Jetson:** the NVIDIA computer on the robot that runs its software.
  [Building for the robot](../building-for-the-robot.md)
- **Launch file:** a file that starts several ROS nodes at once, with their settings.
  [ROS 2 basics](ros2-basics.md#two-more-ideas-you-will-meet)
- **`localhost`:** a name that always means "this computer".
  [Containers](containers.md#two-more-ideas-you-will-meet)
- **`main`:** the team's official branch, the version that runs on the robot.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Markdown:** the simple text format these docs are written in.
  [Your first pull request](first-pull-request.md#3-make-your-change)
- **Merge:** adding a branch's commits to another branch, usually `main`, after review.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Message:** one piece of data sent on a ROS topic. Its **message type** fixes what it
  contains. [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Mount:** sharing a folder from your computer into a container. The dev container
  mounts your clone at `/ws`, so both see the same files.
  [Containers](containers.md#mounting-how-your-files-get-into-the-container)
- **Node:** one program in a ROS system. [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Option:** a word starting with `-` or `--` that changes how a command works; also
  called a flag. [The command line](command-line.md#commands-options-and-arguments)
- **`origin`:** Git's name for the copy of the repository on GitHub.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **Package:** a folder of ROS code that is built as one unit.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **Parameter:** a setting a ROS node reads when it starts, such as a maximum speed.
  [ROS 2 basics](ros2-basics.md#two-more-ideas-you-will-meet)
- **Path:** a file's address, the folders you go through to reach it.
  [The command line](command-line.md#folders-and-paths)
- **Port:** a numbered door that a network program listens on, like an apartment number.
  [Containers](containers.md#two-more-ideas-you-will-meet)
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
- **Rebuild (a container):** build the dev container's image again after its setup in
  `.devcontainer/` changes. [Containers](containers.md#two-more-ideas-you-will-meet)
- **Relative path:** a path that starts from the folder you are in.
  [The command line](command-line.md#folders-and-paths)
- **Repository (repo):** a project folder that Git tracks, with its full history.
  [Git and GitHub](git-and-github.md#the-main-ideas)
- **ROS 2:** Robot Operating System 2, the framework that lets the robot's programs talk
  to each other. [ROS 2 basics](ros2-basics.md)
- **rosdep:** the tool that installs the system software each package says it needs. Our
  `scripts/install_deps.sh` runs it. [Everyday workflow](../everyday-workflow.md#what-to-do-after-a-change)
- **Script:** a file of commands saved so they can be run again.
  [The command line](command-line.md#running-scripts-and-programs)
- **Shell:** the program inside a terminal that reads and runs your commands, such as
  `bash`. [The command line](command-line.md#what-a-terminal-is)
- **SocketCAN:** the CAN bus support built into Linux. [CAN bus](../can-bus.md)
- **Source (a file):** run a setup file's commands in the current terminal, so the
  settings it makes stay. [ROS 2 basics](ros2-basics.md#sourcing-why-you-sometimes-open-a-new-terminal)
- **Staging:** choosing which changes go into your next Git commit, with `git add`.
  [Git and GitHub](git-and-github.md#save-a-snapshot-git-add-and-git-commit)
- **Subscribe:** receive messages from a ROS topic.
  [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **`sudo`:** run a command as an administrator.
  [The command line](command-line.md#running-scripts-and-programs)
- **Terminal:** a window where you type commands. [The command line](command-line.md)
- **Topic:** a named channel that ROS nodes send messages on, such as `/cmd_vel`.
  [ROS 2 basics](ros2-basics.md#nodes-topics-and-messages)
- **Twist:** the standard ROS message for "move at this speed", with forward and turning
  velocities. [ROS 2 basics](ros2-basics.md#try-it-drive-a-turtle)
- **VNC:** remote-desktop technology. The dev container runs a desktop you view over VNC.
  [GUI tools](../gui-tools.md)
- **VS Code:** the code editor most of the team uses.
  [Getting started](../getting-started.md#1-install-the-tools)
- **Working directory:** the folder a terminal is currently in.
  [The command line](command-line.md#folders-and-paths)
- **Workspace:** a folder of ROS packages that are built together; our repository is one.
  [ROS 2 basics](ros2-basics.md#packages-and-the-workspace)
- **WSL:** Windows Subsystem for Linux, which runs Ubuntu inside Windows.
  [The command line](command-line.md#open-a-terminal)
- **x86-64:** the type of processor in most laptops.
  [Building for the robot](../building-for-the-robot.md)
