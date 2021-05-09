<p align="center">
      <a href="https://join.slack.com/t/truenas/shared_invite/zt-f5vf90vr-vG0q9vGcaiiwKLYaW0cfRg"><img alt="Join Slack" src="https://badgen.net/badge/Slack/Chat%20Now/?icon=slack" /></a>
 <a href="https://www.truenas.com/community/"><img alt="Join Forums" src="https://badgen.net/badge/Forums/Post%20Now//purple" /></a> 
 <a href="https://jira.ixsystems.com"><img alt="File Issue" src="https://badgen.net/badge/Jira/File%20Issue//red?icon=jira" /></a>
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
  - Node.js >= 8.9
  - Running TrueNAS CORE or TrueNAS SCALE Nightly Machine (VM is fine)


# Getting started

Install the development requirements (FreeBSD 11 or later):

```sh
# pkg install yarn
```

Checkout TrueNAS git repository:

```sh
$ git clone https://github.com/truenas/webui.git
$ cd webui
```

Install yarn packages:

```sh
$ yarn install
```

Run the environment configuration script
(if your ip address changes later you may repeat this step)

```sh
$ ./setup_env.js -i <ip address or FQDN of the server where TrueNAS is running>
```

To start run
```yarn start```

This runs a local webserver with the new WebUI, by default at http://localhost:4200.
If this webserver is kept running, changes to the project will be rebuilt incrementally.

To test AOT in dev mode run

```yarn run start:dev:aot```

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
This should bring the yarn environment back to a useable state.

# Translating Text to Other Languages

All PO files for translating TrueNAS's web interface are included in this repository under [src/assets/i18n](https://github.com/truenas/webui/tree/master/src/assets/i18n).
These can be edited with any offline PO editor, such as [Poedit](https://poedit.net/), or via the GitHub Web based code editing system.

To extract all of the strings from the project to be translated run:
```yarn run extract```

This will update all of the PO files located in the [src/assets/i18n](https://github.com/truenas/webui/tree/master/src/assets/i18n) directory.



Stock images used on the dashboard UI are courtesy of Pixabay.com and are subject to the Simplified Pixabay License. 
Full license details can be found at https://pixabay.com/service/license/.
