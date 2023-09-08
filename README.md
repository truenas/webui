<p align="center">
 <a href="https://discord.gg/Q3St5fPETd"><img alt="Join Discord" src="https://badgen.net/discord/members/Q3St5fPETd/?icon=discord&label=Join%20the%20TrueNAS%20Community" /></a>
 <a href="https://www.truenas.com/community/"><img alt="Join Forums" src="https://badgen.net/badge/Forums/Post%20Now//purple" /></a> 
 <a href="https://ixsystems.atlassian.net/browse/NAS/"><img alt="File Issue" src="https://badgen.net/badge/Jira/File%20Issue//red?icon=jira" /></a>
</p>

TrueNAS WebUI
================
[![Latest Docker Image - master](https://github.com/truenas/webui/actions/workflows/docker_latest.yml/badge.svg)](https://github.com/truenas/webui/actions/workflows/docker_latest.yml)


This is the project for the Angular.io WebUI for TrueNAS CORE & TrueNAS SCALE.

# Testing Images

You can download and test running the latest version of the TrueNAS WebUI anytime using pre-built docker images.

Images only require the environment variable TNIP to be set to the IP or Hostname of your local TrueNAS instance.

Example:

```
# docker container run -it -e TNIP=192.168.0.30 -p 8080:80 ixsystems/truenas-webui:latest
```
This would allow you to access the running WebUI on http://localhost:8080

NOTE: Pull requests are also generated as Docker images and can be used for testing by replacing the ":latest" tag with the pull-request ID. I.E. "ixsystems/truenas-webui:5010"

# Development requirements

  - yarn >= 1.12
  - Node.js >= 14
  - Running TrueNAS CORE or TrueNAS SCALE Nightly Machine (VM is fine)


# Getting started

Have a system with yarn.

Checkout TrueNAS git repository:

```sh
$ git clone https://github.com/truenas/webui.git
$ cd webui
```

Install yarn packages:

```sh
$ yarn install
```

Generate an environment file

```sh
$ yarn check-env
```

Configure the remote TrueNAS system you'd like to connect to. 
(if your ip address changes later you may repeat this step)

```sh
$ yarn ui remote -i <ip address or FQDN of the server where TrueNAS is running>
```
NOTE: It is highly recommended to create an alias in your shell of choice to 'ui' to minimize typing
If this script gives a typescript error in the console, please see the section above on generating an environment file

zsh example: `alias ui='yarn run --silent ui`

## Starting the Application

To start run
```yarn start```

This runs a local webserver with the new WebUI, by default at http://localhost:4200.
If this webserver is kept running, changes to the project will be rebuilt incrementally.

To run the production build, run

```yarn run build:prod:aot```

Getting errors about missing packages?

```yarn install```

Getting permission errors or Failed messages when trying to run `yarn start`?

From the webui repo
```
rm -rf node_modules (may need root)
rm yarn.lock 
yarn cache clean --force
yarn install
```
This should bring the yarn environment back to a usable state.

# Translating Text to Other Languages

All JSON files for translating TrueNAS's web interface are included in this repository under [src/assets/i18n](https://github.com/truenas/webui/tree/master/src/assets/i18n). \
These can be edited using your editor of choice or directly via the GitHub Web based code editing system.

Some strings may use [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/#plural-format) for pluralization.\
You can move tokens around and adjust them for your language.

For example:
```
Deleted {n, plural, one {# snapshot} other {# snapshots}}
```
can be translated in Russian as:
```
{n, plural, =1 {Снимок удален} few{# снимка удалено} other {# снимков удалено}}
```

You can test your strings in an [online editor](http://format-message.github.io/icu-message-format-for-translators/editor.html).


Stock images used on the dashboard UI are courtesy of Pixabay.com and are subject to the Simplified Pixabay License. 
Full license details can be found at https://pixabay.com/service/license/.


# Contributing

Learn how you can contribute to our project and help us maintain it [on our Contribution guide](https://github.com/truenas/webui/blob/master/CONTRIBUTING.md).