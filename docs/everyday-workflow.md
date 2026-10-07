# Everyday workflow

How to edit, build, test, and run code once you are set up. If you are not set up yet,
start with [Getting started](getting-started.md). This page uses the ideas from
[ROS 2 basics](learn/ros2-basics.md), such as packages, building, and sourcing.

## Where to run commands

The commands on this page run in a terminal inside the dev container, or in any terminal
if you use a native ROS install. There are two ways to get a dev container terminal:

- **A container terminal:** in VS Code, **Terminal > New Terminal**.
- **Your own terminal, with `scripts/dev`:** it runs each command inside the container for
  you. See [Run commands from your own terminal](#run-commands-from-your-own-terminal).

## The edit, build, run loop

1. **Edit** files in `src/` with any editor. The container sees the same files at `/ws`.
2. **Build** with colcon. Building everything works, but building only the package you
   changed is faster:

    ```bash
    colcon build
    colcon build --packages-select luna_drivetrain
    ```

3. **Run** a node with `ros2 run <package> <executable>`:

    ```bash
    ros2 run luna_drivetrain motor_test
    ```

    After you build a new package or a new executable, open a new terminal first, or run
    `source install/setup.bash`, so ROS can find it.

4. **Test** before you push. Pull requests must pass these:

    ```bash
    colcon test && colcon test-result --verbose
    ```

    To fix C++ formatting automatically, run `ament_uncrustify --reformat src/<package>`.

## What to do after a change

| You changed | Then |
| --- | --- |
| C++ code | `colcon build` |
| An existing Python node, launch file, or parameter file | Nothing, once the package has been built: `install/` points at your files in `src/` instead of copying them, so it sees your edits |
| A new file, package, or executable | `colcon build`, then open a new terminal |
| Dependencies in a `package.xml` | `scripts/install_deps.sh`, which installs them with rosdep, then `colcon build` |
| Anything in `.devcontainer/` | Rebuild the container: **Dev Containers: Rebuild Container** in VS Code, or `scripts/dev rebuild` |
| Between the dev container and a native install | `rm -rf build install log`, then `colcon build` ([why](development-environment.md#one-clone-one-environment)) |

Rebuilding the container and running `colcon build` are different things. The container is
the environment: it only needs rebuilding when `.devcontainer/` changes. `colcon build`
compiles your code, inside that environment, whenever the code changes.

## Run commands from your own terminal

`scripts/dev` runs commands in the dev container from your own terminal, so you can use
any editor without opening VS Code. It reads the same `.devcontainer/` configuration and
starts the container if it is not running.

```bash
scripts/dev build
scripts/dev run ros2 run demo_nodes_cpp talker
```

On Windows, run it in your Ubuntu (WSL) terminal.

### Set it up once

`scripts/dev` uses the Dev Containers CLI. Install it with its standalone installer, which
does not need Node.js:

```bash
curl -fsSL https://raw.githubusercontent.com/devcontainers/cli/main/scripts/install.sh | sh
```

Then add this line to your shell's startup file, `~/.bashrc` on Linux and WSL or
`~/.zshrc` on macOS, and open a new terminal:

```bash
export PATH="$HOME/.devcontainers/bin:$PATH"
```

Without the CLI, `scripts/dev` falls back to running it through `npx`, which needs
Node.js and makes each command about 3 seconds slower.

### Commands

| Command | What it does |
| --- | --- |
| `scripts/dev up` | Starts the dev container, building it the first time. |
| `scripts/dev shell` | Opens a terminal inside the container. Type `exit` to leave. |
| `scripts/dev build [args]` | Runs `colcon build` with any extra arguments, such as `--packages-select luna_drivetrain`. |
| `scripts/dev test [args]` | Runs `colcon test` and shows the results. Fails if any test fails. |
| `scripts/dev run <command>` | Runs any command in `/ws`, with ROS and the built workspace loaded. |
| `scripts/dev stop` | Stops the dev container. |
| `scripts/dev rebuild` | Recreates the container after changes to `.devcontainer/`. |
| `scripts/dev help` | Shows this list. |

Every command except `stop` and `help` starts the container first if it is not running.
Ctrl+C stops a program started with `run`, as it would in a container terminal.

### Native windows configuration

`scripts/dev` uses the default VNC configuration. For the native windows configuration
(Linux only; see [GUI tools](gui-tools.md)), put `--native` before the command:

```bash
scripts/dev --native build
```

To make it your default, add `export LUNA_DEV_CONFIG=linux-native` to your `~/.bashrc`.

### Limits

- **Autocomplete:** an editor running outside the container cannot see ROS's headers, so
  its C++ autocomplete does not understand ROS code. VS Code with the dev container does.
- **VNC desktop on macOS and Windows:** the CLI cannot forward ports, so the VNC desktop
  is only reachable when the container is open in VS Code or another editor. On Linux it
  works either way.
- **Speed:** each command takes about 2 seconds to reach the container.

## Stop the container

The container keeps running in the background, along with its VNC desktop, until it is
stopped. VS Code stops it when you close the window. If you started it with `scripts/dev`,
stop it with:

```bash
scripts/dev stop
```

Starting it again takes a few seconds; your code and build output are untouched.

## Clean the build

If a build fails in a way that makes no sense, or you switched between the dev container
and a native install, delete the build output and build again:

```bash
rm -rf build install log
colcon build
```
