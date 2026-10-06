# The command line

Most programming tools have no buttons to click. You use them by typing commands into a
terminal. This page teaches you enough to follow every command in these docs: what a
terminal is, how to move around your files, and what to do when something goes wrong.

## What a terminal is

A **terminal** is a window where you type commands and the computer answers in text. The
program inside it that reads your commands is called the **shell** (on Linux it is usually
`bash`, and on macOS `zsh`; for this page they work the same). Working this way is called
using the **command line**.

It can feel old-fashioned, but it has real advantages: a command does exactly the same
thing every time, you can copy it from these docs instead of hunting for buttons, and many
robotics tools only exist as commands.

## Open a terminal

- **Windows:** these docs use Ubuntu, a version of Linux that runs inside Windows through
  WSL. If you have not set it up yet, open the Start menu, right-click **Windows
  PowerShell**, choose **Run as administrator**, and run `wsl --install`. Restart your
  computer when it asks. Then open **Ubuntu** from the Start menu; the first time, it asks
  you to choose a username and password. Use the Ubuntu terminal, not PowerShell, for
  everything in these docs.
- **macOS:** press Cmd+Space, type `Terminal`, and press Enter.
- **Linux (Ubuntu):** press Ctrl+Alt+T.

Later, once your dev container is set up, VS Code's own terminal (**Terminal > New
Terminal**) is where you will run most commands.

## Your first commands

The terminal shows a **prompt** and waits for you. It usually looks something like this,
showing your username, your computer's name, and the folder you are in:

```text
ada@laptop:~$
```

On macOS it ends with `%` instead of `$`.

To run a command, type it after the prompt and press Enter. In these docs, commands are
shown in boxes like the one below. Type only the command, not the prompt.

Try these three, one at a time:

```bash
pwd
ls
echo Hello, robot
```

- `pwd` ("print working directory") shows which folder you are in, such as `/home/ada`.
- `ls` ("list") shows what is in that folder.
- `echo` prints back whatever you give it: `Hello, robot`.

## Folders and paths

Your files live in **folders** (also called **directories**), and folders live inside
other folders, like a family tree. The top of the tree is called `/`. Your own files are
in your **home folder**: `/home/ada` on Linux, or `/Users/ada` on macOS. The shortcut `~`
always means your home folder.

A **path** is a file's address, the list of folders you go through to reach it, separated
by `/`:

```text
/home/ada/projects/starrt-luna-software/README.md
```

At any moment the terminal is "in" one folder, called the **working directory**. Paths can
be written two ways:

- An **absolute path** starts with `/` and works from anywhere, like a full street address.
- A **relative path** starts from the folder you are in, like "the house next door". If you
  are in `/home/ada/projects`, the relative path `starrt-luna-software/README.md` means the
  same file as the absolute path above.

Two more shortcuts: `.` means "this folder", and `..` means "the folder above this one".

### Try it: make a folder and a file

```bash
cd ~
mkdir practice
cd practice
pwd
echo "my first file" > notes.txt
ls
cat notes.txt
cd ..
```

Here is what each line does:

1. `cd ~` goes to your home folder (`cd` means "change directory").
2. `mkdir practice` makes a new folder called `practice`.
3. `cd practice` goes into it, and `pwd` shows you are now in `/home/ada/practice` (with
   your own username).
4. `echo "my first file" > notes.txt` writes the text into a new file. The `>` sends a
   command's output into a file instead of the screen.
5. `ls` shows `notes.txt`, and `cat notes.txt` prints what is inside it.
6. `cd ..` goes back up to your home folder.

When you are done, delete the practice folder with `rm -r practice`. Be careful with `rm`:
the command line has no recycle bin, so deleted files are gone for good.

## Commands, options, and arguments

Most commands take extra words that change what they do. Take this one from
[Everyday workflow](../everyday-workflow.md):

```bash
colcon build --packages-select luna_drivetrain
```

- `colcon` is the **command**: the program to run.
- `build` is a **subcommand**: which of colcon's jobs to do.
- `--packages-select` is an **option** (also called a flag). Options start with `-` or
  `--` and adjust how the command works.
- `luna_drivetrain` is an **argument**: the thing the option applies to.

Most commands explain their own options if you add `--help`, for example `ls --help`.

## Keys that save time

- **Tab** finishes a name for you. Type the first few letters of a file or folder name and
  press Tab, and the terminal fills in the rest. If several names match, press Tab twice
  to see them all.
- **Up arrow** brings back your previous commands, so you can run one again or fix a typo.
- **Ctrl+C** stops the command that is running. Use it to stop a program that keeps
  going, like the ROS 2 talker demo.
- **Copy and paste** use Ctrl+Shift+C and Ctrl+Shift+V in most terminals (Cmd+C and Cmd+V
  on macOS), because Ctrl+C on its own means "stop".

## Running scripts and programs

A **script** is a file of commands saved so they can be run again. To run one, type its
path. For example, from the top folder of our repository:

```bash
scripts/dev help
```

Some commands need administrator rights to change the system. Putting `sudo` ("superuser
do") in front runs a command as an administrator. It asks for your password, and nothing
appears on screen while you type it; that is normal, so type it and press Enter.

## Environment variables

An **environment variable** is a named setting that the shell hands to every program it
runs. `$` in front of a name reads one:

```bash
echo $HOME
```

`export` sets one, but only for the terminal you type it in:

```bash
export GREETING=hello
echo $GREETING
```

Open a new terminal and run `echo $GREETING` again: it prints an empty line, because a new
terminal starts fresh. To set a variable in every new terminal, add the `export` line to
your shell's startup file, `~/.bashrc` (or `~/.zshrc` on macOS), which runs each time a
terminal opens.

`source <file>` runs a file's commands in the current terminal, so the variables it sets
stay. ROS 2 uses this to tell the terminal where its programs are, which is why the docs
sometimes say to "source" a file or open a new terminal. [ROS 2 basics](ros2-basics.md)
explains it.

## When something goes wrong

Error messages look scary but usually say exactly what is wrong. Read the last few lines
first. Common ones:

| Message | What it usually means |
| --- | --- |
| `command not found` | A typo in the command, or the program is not installed. |
| `No such file or directory` | The path is wrong. Run `pwd` and `ls` to see where you are. |
| `Permission denied` | You need `sudo`, or the file is not meant to be run. |

If a command seems stuck, press Ctrl+C. If you are still stuck, ask in your workstream's
thread, and paste the exact command you ran and the full error message.

## Key ideas

- A terminal runs commands you type; the prompt shows it is ready.
- Files live in folders; a path is a file's address, absolute (from `/`) or relative (from
  where you are).
- Commands take subcommands, options, and arguments, and `--help` explains them.
- Ctrl+C stops a running command; Tab and the up arrow save typing.
- Environment variables are settings for programs; a new terminal starts fresh.

Next: [Git and GitHub](git-and-github.md).
