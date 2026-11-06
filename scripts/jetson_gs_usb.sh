#!/usr/bin/env bash
# Builds and installs gs_usb, the Linux driver the CANable needs, on a Jetson whose kernel
# leaves it out (JetPack 6). It downloads gs_usb.c for the running kernel's version from
# kernel.org, installs it with DKMS, and loads it. Run it again if can0 stops appearing
# after a kernel update. Needs sudo and an internet connection.
#
#   scripts/jetson_gs_usb.sh
set -euo pipefail

if modinfo gs_usb >/dev/null 2>&1; then
    echo "gs_usb is already available for kernel $(uname -r); nothing to do."
    exit 0
fi

kernel="$(uname -r)"        # for example 5.15.148-tegra
version="${kernel%%-*}"     # 5.15.148
IFS=. read -r major minor patch <<<"$version"
# kernel.org tags a release with no patch number as v5.15, not v5.15.0.
tag="v${major}.${minor}"
if [[ -n "${patch:-}" && "$patch" != 0 ]]; then
    tag="${tag}.${patch}"
fi

if [[ ! -e "/lib/modules/${kernel}/build/Makefile" ]]; then
    echo "No kernel headers for ${kernel}. On a Jetson, install them with:" >&2
    echo "  sudo apt install nvidia-l4t-kernel-headers" >&2
    exit 1
fi

if ! command -v dkms >/dev/null; then
    sudo apt-get install -y dkms
fi

name=gs-usb-can
src="/usr/src/${name}-${version}"
url="https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/plain/drivers/net/can/usb/gs_usb.c?h=${tag}"

sudo mkdir -p "$src"
curl --fail --silent --show-error --location "$url" | sudo tee "$src/gs_usb.c" >/dev/null
echo 'obj-m := gs_usb.o' | sudo tee "$src/Makefile" >/dev/null
sudo tee "$src/dkms.conf" >/dev/null <<EOF
PACKAGE_NAME="${name}"
PACKAGE_VERSION="${version}"
BUILT_MODULE_NAME[0]="gs_usb"
DEST_MODULE_LOCATION[0]="/updates/dkms"
AUTOINSTALL="yes"
EOF

# A rerun finds the package already added, so add it only the first time.
if ! dkms status -m "$name" -v "$version" | grep -q .; then
    sudo dkms add -m "$name" -v "$version"
fi
sudo dkms build -m "$name" -v "$version" -k "$kernel" --force
sudo dkms install -m "$name" -v "$version" -k "$kernel" --force
sudo modprobe gs_usb

modinfo gs_usb | head -n 3
