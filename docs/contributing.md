# Contributing

How changes get into the robot software. Everything goes through a pull request, including
design docs and these docs. Nobody pushes to `main` directly.

New to Git or pull requests? Read [Git and GitHub](learn/git-and-github.md), then follow
[Your first pull request](learn/first-pull-request.md) for a step-by-step walkthrough.

## Workflow

1. Start from a deliverable assigned to you in Turgor.
2. Branch from an up-to-date `main`, naming the branch after your workstream:

    ```bash
    git switch main && git pull
    git switch -c drivetrain/cmd-vel-skeleton
    ```

3. Make your change. If it changes how to set up, build, run, or use something, update the
   docs in the same pull request (see [Writing docs](writing-docs.md)).
4. Build and test before you push, in a container terminal:

    ```bash
    colcon build
    colcon test && colcon test-result --verbose
    ```

    Or from your own terminal: `scripts/dev build` and `scripts/dev test`.

5. Open a pull request, fill in the template, and get one approving review. Changes to
   interfaces or design docs also need the software lead's review.
6. Show what you merged at the Sunday meeting.

## Interfaces and design docs

Each subsystem's design doc defines its interfaces: its topics, services, actions, message
types, rates, QoS, and parameters. That table is a contract. **A pull request that changes
an interface updates the design doc in the same pull request**, and reviewers reject pull
requests where the code and the doc disagree. [Design docs](design/README.md) explains how
they work.

## Packages

- One package per subsystem, named `luna_<subsystem>`. ROS package names use lowercase
  letters, digits, and underscores only; no hyphens.
- Create a package from inside `src/`:

    ```bash
    ros2 pkg create --build-type ament_cmake --license Apache-2.0 luna_example
    ```

    Then replace the `if(BUILD_TESTING)` block in its `CMakeLists.txt` with the one in
    `src/luna_drivetrain/CMakeLists.txt`, so the linters run without per-file copyright
    headers.

- Declare every dependency in `package.xml`, then run `scripts/install_deps.sh` to
  install it.
- Never commit third-party binaries or SDKs. Download them at build time, the way
  `src/ctre_phoenix5_vendor` does.

## Code style

`colcon test` runs the standard ROS 2 linters (`cpplint`, `uncrustify`, `flake8`, and
others) on every package, and pull requests must pass them. To fix C++ formatting
automatically:

```bash
ament_uncrustify --reformat src/<package>
```

## When you are stuck

Check in this order: the design doc, your workstream's thread, the team channel, then the
software lead.

## License

This repository is licensed under Apache-2.0 (the `LICENSE` file). You keep the copyright
to what you write, and by contributing you license it to everyone under Apache-2.0. Files
do not need a copyright header; the `LICENSE` file covers the whole repository.

As section 5 of the license puts it:

> Unless You explicitly state otherwise, any Contribution intentionally submitted for
> inclusion in the Work by You to the Licensor shall be under the terms and conditions of
> this License, without any additional terms or conditions.
