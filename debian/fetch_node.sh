#!/bin/sh -ex
# Download per-built nodejs binary from upstream and place in paths that yarn
# expects to find it. This script is called from within scale-build to prevent
# accidental changes to host OS if developer tries to build the debian package
# outside of a chroot environment.
#
# The same script runs in the Build job of .github/workflows/main.yml, so a
# version or checksum that would break the nightly fails on the PR instead.

# The version comes from .node-version at the repo root, which CI and local
# version managers read too. Bumping Node means editing that file AND the two
# SHA256SUM values below.
VERSION="v$(tr -d '[:space:]' < "$(dirname "$0")/../.node-version")"

# shasums can be downloaded from https://nodejs.org/dist/${VERSION}/SHASUMS256.txt
# checksum changes without version change should be investigated.
if [ "$(uname -m)" = "aarch64" ];
then
    PLATFORM=linux-arm64
    SHA256SUM="f3d5a797b5d210ce8e2cb265544c8e482eaedcb8aa409a8b46da7e8595d0dda0"
else
    PLATFORM=linux-x64
    SHA256SUM="472655581fb851559730c48763e0c9d3bc25975c59d518003fc0849d3e4ba0f6"
fi

wget https://nodejs.org/dist/${VERSION}/node-${VERSION}-${PLATFORM}.tar.xz

# validate shasum of prebuilt nodejs
if ! echo "${SHA256SUM}  node-${VERSION}-${PLATFORM}.tar.xz" | sha256sum -c -;
then
    # Stopping here leaves no nodejs for `yarn install` in scale-build, so
    # further error handling in this script is not required.
    set +x
    echo "checksum validation failed for node ${VERSION} (${PLATFORM})!"
    echo "If .node-version was just bumped, update both SHA256SUM values in"
    echo "debian/fetch_node.sh from https://nodejs.org/dist/${VERSION}/SHASUMS256.txt"
    echo "If the version did not change, do not update them: investigate."
    exit 1
fi

tar -xvf node-${VERSION}-${PLATFORM}.tar.xz
mv node-${VERSION}-${PLATFORM}/bin/* /usr/bin/
mv node-${VERSION}-${PLATFORM}/lib/* /usr/lib/
rm -rf node-${VERSION}-${PLATFORM}*
