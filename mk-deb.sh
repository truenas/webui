#!/bin/sh

if [ -z "$1" ] ; then
	echo "Missing GPG signing key"
	exit 1
fi

yarnpkg install
tar cvzf node_files.tgz node_modules/
rm -rf node_modules

DATESTAMP=$(date +%Y%m%d%H%M)
dch -v ${DATESTAMP}~truenas+1 --force-distribution --distribution bullseye-truenas-unstable "Auto Update from Jenkins CI"

dpkg-buildpackage --sign-key=${1}
