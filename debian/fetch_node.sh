#!/bin/sh -ex
# Download per-built nodejs binary from upstream and place in paths that yarn
# expects to find it. This script is called from within scale-build to prevent
# accidental changes to host OS if developer tries to build the debian package
# outside of a chroot environment.

# Update VERSION below to switch nodejs versions
VERSION=v22.2.0

# shasums can be downloaded from https://nodejs.org/dist/${VERSION}/SHASUMS256.txt
# checksum changes without version change should be investigated.
SHA256SUM="3544eee9cb1414d6e9003efd56bc807ffb0f4445d2fc383e1df04c3e5e72c91b"

PLATFORM=linux-x64

wget https://nodejs.org/dist/${VERSION}/node-${VERSION}-${PLATFORM}.tar.xz

# validate shasum of prebuilt nodejs
echo -n "${SHA256SUM} node-${VERSION}-${PLATFORM}.tar.xz" | sha256sum -c -
RETURN=$?

if [ $RETURN -ne 0 ];
then
    # Failing here will cause `yarn install` to fail due to missing nodejs in
    # scale-build, and so further error handling in this script is not required.
    echo "checksum validation failed!"
    exit ${RETURN}
fi

tar -xvf node-${VERSION}-${PLATFORM}.tar.xz
mv node-${VERSION}-${PLATFORM}/bin/* /usr/bin/
mv node-${VERSION}-${PLATFORM}/lib/* /usr/lib/
rm -rf node-${VERSION}-${PLATFORM}*
