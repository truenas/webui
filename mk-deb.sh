#!/bin/sh

if [ -z "$1" ] ; then
	echo "Missing GPG signing key"
	exit 1
fi

yarnpkg install
tar cvzf node_files.tgz node_modules/
rm -rf node_modules

dpkg-buildpackage --sign-key=${1}
