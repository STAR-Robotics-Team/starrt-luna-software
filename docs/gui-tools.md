# GUI tools

How to see RViz, rqt, turtlesim, and other programs with windows that run in the dev
container. There are two ways: a desktop inside the container that you view over VNC, or
normal windows on your own desktop.

| | VNC desktop | Native windows |
| --- | --- | --- |
| Works on | Every operating system | Linux; macOS through XQuartz, except RViz |
| RViz and other 3D programs | Yes | Yes on Linux; not through XQuartz |
| Setup | None; it is the default | Linux: pick the native windows configuration. macOS: a few commands |

## VNC desktop (any operating system)

The default dev container configuration runs a desktop and a VNC server inside the
container. VNC is the same remote-desktop technology used to control a computer over a
network. Programs draw everything inside the container, including 3D with software
OpenGL, and VNC only sends the finished picture to your screen. That is why RViz works
this way on every operating system.

The desktop starts with the container, and every new terminal prints where to find it.
There are two ways to view it, with no setup:

- **In your browser:** open
  <http://localhost:6080/vnc.html?autoconnect=true&resize=remote>. The page sizes the
  desktop to your browser window. It may say the connection is "unencrypted"; that is
  fine, because the connection never leaves your computer.
- **In a VNC viewer app,** such as [TigerVNC](https://tigervnc.org/) or RealVNC Viewer:
  connect to `localhost:5901`. There is no password.

Programs started in a container terminal appear on that desktop. Both ports only accept
connections from your own computer, never from the network. VS Code makes them reachable
on macOS and Windows; the Dev Containers CLI and `scripts/dev` cannot, so on those
systems the desktop needs VS Code or another editor.

## Native windows on Linux

Open the repository with the **STAR Lunabotics: native windows (Linux, no VNC)**
configuration (see [the two configurations](development-environment.md#the-two-configurations)).
It builds the container without VNC, and programs open as normal windows on your desktop
with no further setup. Behind the scenes it does three things:

- **Before the container starts,** it runs `xhost +SI:localuser:$USER` on your computer.
  This lets programs running as your user open windows, which includes the container,
  because its user has the same user ID as you. It lasts until you log out. Docker's
  ROS 2 guide uses `xhost +local:docker` instead, which lets every user on the computer
  open windows; this is narrower.
- **It sets `DISPLAY`** in the container to your desktop's display.
- **It sets `LIBGL_ALWAYS_SOFTWARE=1`,** which makes RViz draw with the CPU. The
  container cannot use your graphics card, and without this setting RViz stalls while
  starting up.

To get native windows from the VNC configuration instead, run the `xhost` command above on
your computer, then `export DISPLAY=:0 LIBGL_ALWAYS_SOFTWARE=1` in the container terminal
before starting programs. Run `echo $DISPLAY` on your computer to check the display
number.

## Native windows on macOS with XQuartz

[XQuartz](https://www.xquartz.org/) lets the container open normal Mac windows, for 2D
programs only. A team member got this working with the sample setup from
[Docker's ROS 2 guide](https://docs.docker.com/guides/ros2/), and these steps match that
guide. That sample uses host networking like our dev container, so the steps should carry
over, but nobody has tried them with our dev container yet.

1. Install XQuartz:

   ```bash
   brew install --cask xquartz
   ```

2. Open XQuartz, go to **Settings > Security**, and turn on **Allow connections from
   network clients**. Restart the Mac.
3. In a Mac terminal, allow connections from the container. The `xhost` lines reset
   whenever XQuartz restarts, so run them again each time:

   ```bash
   defaults write org.xquartz.X11 nolisten_tcp -bool false
   xhost +localhost
   xhost + 127.0.0.1
   ```

4. In the container terminal, point programs at XQuartz before starting them:

   ```bash
   export DISPLAY=host.docker.internal:0 QT_X11_NO_MITSHM=1
   ```

   `QT_X11_NO_MITSHM=1` stops Qt programs such as rqt from trying to share memory with
   XQuartz, which cannot work across the virtual machine Docker runs in.

This works for 2D programs such as turtlesim and rqt. **RViz does not work through
XQuartz**; a team member tried it. RViz is a 3D program that sends OpenGL drawing commands
to the display, and XQuartz cannot handle the modern OpenGL that RViz needs. Use the VNC
desktop for RViz and other 3D programs.
