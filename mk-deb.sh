#!/bin/sh

yarnpkg install
tar cvzf node_files.tgz node_modules/
rm -rf node_modules
