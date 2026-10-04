# ctre_phoenix5_vendor

Gives the workspace the CTRE Phoenix 5 C++ libraries, which drive our Talon SRX and Victor
SPX motor controllers over SocketCAN.

## Use it from a package

In `package.xml`:

```xml
<depend>ctre_phoenix5_vendor</depend>
```

In `CMakeLists.txt`:

```cmake
find_package(ctre_phoenix5_vendor REQUIRED)
target_link_libraries(my_node ctre_phoenix5_vendor::phoenix5)
```

Then `#include "ctre/Phoenix.h"`. The target already defines `Phoenix_No_WPI` (do not
define it yourself) and compiles your code as C++20, which the Phoenix headers require.

## Why the libraries are downloaded, not committed

CTRE's license (installed with the libraries at
`share/ctre_phoenix5_vendor/ctre_licenses/CTRE_LICENSE.txt`) lets us *use* Phoenix with
CTRE hardware, but forbids making the software "available to any third party". This
repository is public, so committing CTRE's files to it would share them with everyone.

Instead, `colcon build` downloads them from CTRE's official maven repository on each
machine. Nothing CTRE owns is ever stored in this repository; each person gets Phoenix
directly from CTRE and uses it under CTRE's license.

## Pinned versions

| Archive | Version |
| --- | --- |
| Phoenix 5 `api-cpp` and `cci` | 5.36.0 |
| Phoenix 6 `tools` (shared backend) | 26.1.3 |

Every archive is checked against a SHA-256 hash in `CMakeLists.txt`, and the build fails
if a download does not match. Linux on x86-64 (laptops, CI) and arm64 (the Jetson, Apple
Silicon Macs in the dev container) are supported.

## Building offline

Archives are kept in `~/.cache/ctre_phoenix5_vendor`, so only the first build needs
internet. To build on a machine that has never been online, copy that folder over from
one that has. Set `-DCTRE_DOWNLOAD_DIR=<path>` to use a different folder, or
`-DCTRE_MAVEN_URL=<url>` if CTRE moves its repository.

## Upgrading Phoenix

1. Pick versions from CTRE's maven listings for
   [api-cpp](https://maven.ctr-electronics.com/release/com/ctre/phoenix/api-cpp/),
   [cci](https://maven.ctr-electronics.com/release/com/ctre/phoenix/cci/), and
   [tools](https://maven.ctr-electronics.com/release/com/ctre/phoenix6/tools/).
2. Change `PHOENIX5_VERSION` and `PHOENIX6_TOOLS_VERSION` in `CMakeLists.txt`.
3. Download each archive the build uses (`headers`, `linuxx86-64`, and `linuxarm64` for
   each of the three), run `sha256sum` on them, and replace every hash.
4. Test on the motors before merging. A Phoenix upgrade can change motor behavior.
