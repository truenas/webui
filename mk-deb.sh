#!/bin/sh

if [ -z "$1" ] ; then
	echo "Missing GPG signing key"
	exit 1
fi

corepack enable
yarn install --immutable
tar cvzf node_files.tgz node_modules/
rm -rf node_modules

DATESTAMP=$(date +%Y%m%d%H%M)
dch -M -v ${DATESTAMP}~truenas+1 --force-distribution --distribution bullseye-truenas-unstable "Auto Update from Jenkins CI"

dpkg-buildpackage --sign-key=${1}
