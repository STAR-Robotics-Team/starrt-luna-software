# Contributing

Everything on the robot goes through a pull request, including design docs. Nobody pushes
to `main` directly.

## Workflow

1. Start from a deliverable assigned to you in Turgor.
2. Branch from an up-to-date `main`, naming the branch after your workstream:

   ```bash
   git switch main && git pull
   git switch -c drivetrain/cmd-vel-skeleton
   ```

3. Build and test in the dev container before you push:

   ```bash
   colcon build
   colcon test && colcon test-result --verbose
   ```

4. Open a pull request, fill in the template, and get one approving review. Interface
   changes and design docs also need the software lead's review.
5. Show what you merged at the Sunday meeting.

## Design docs and interfaces

- Each subsystem has a design doc at `docs/design/<subsystem>.md`. Start one by copying
  [`docs/design/_template.md`](docs/design/_template.md).
- **Each doc's interface table is a contract.** A pull request that changes a topic,
  service, action, message type, rate, QoS, or parameter updates the design doc in the
  same pull request. Reviewers reject pull requests where the code and the doc disagree.
- The first code in every workstream is a skeleton node that matches its interface table
  exactly, publishing fake data.
- Draw diagrams in Mermaid. GitHub renders them, and the dev container's VS Code shows
  them in Markdown preview.

## Packages

- One package per subsystem, named `luna_<subsystem>`. ROS package names use lowercase
  letters, digits, and underscores only; no hyphens.
- Create a package from inside `src/`:

  ```bash
  ros2 pkg create --build-type ament_cmake --license Apache-2.0 luna_example
  ```

  Then replace the `if(BUILD_TESTING)` block in its `CMakeLists.txt` with the one in
  [`src/luna_drivetrain/CMakeLists.txt`](src/luna_drivetrain/CMakeLists.txt), so the
  linters run without per-file copyright headers.
- Declare every dependency in `package.xml`, then run `scripts/install_deps.sh` to
  install it.
- Never commit third-party binaries or SDKs. Download them at build time, the way
  [`ctre_phoenix5_vendor`](src/ctre_phoenix5_vendor/README.md) does.

## Code style

`colcon test` runs the standard ROS 2 linters (`cpplint`, `uncrustify`, `flake8`, and
others) on every package, and pull requests must pass them. To fix C++ formatting
automatically:

```bash
ament_uncrustify --reformat src/<package>
```

## When you are stuck

Check in this order: the design doc, your pair, the team channel, then the software lead.

## License

This repository is licensed under [Apache-2.0](LICENSE). You keep the copyright to what you
write, and by contributing you license it to everyone under Apache-2.0. Files do not need
a copyright header; the `LICENSE` file covers the whole repository.

As section 5 of the license puts it:

> Unless You explicitly state otherwise, any Contribution intentionally submitted for
> inclusion in the Work by You to the Licensor shall be under the terms and conditions of
> this License, without any additional terms or conditions.
