
FreeNAS 11 WebUI
================
[![Build Status](https://builds.ixsystems.com/jenkins/job/FreeNAS%20-%20WebUI%20Pipeline/job/Github%20master%20/badge/icon)](https://builds.ixsystems.com/jenkins/job/FreeNAS%20-%20WebUI%20Pipeline/job/Github%20master%20/)


This is the project for the new angular.io (5.x) WebUI for FreeNAS 11. It is meant to coexist with current FreeNAS 11 Django/Dojo WebUI.

# Development requirements

  - npm >= 5
  - Node.js >= 5
  - Running FreeNAS 11 Nightly Machine (VM is fine)


# Getting started

Install the development requirements (FreeBSD 11 or later):

```sh
# pkg install npm
```

On some operating systems it is quickest to install npm > 3 first then install npm:

```sh
# npm install -g npm5
```

Checkout FreeNAS git repository:

```sh
$ git clone https://github.com/freenas/webui.git
$ cd webui
```

Install npm packages:

```sh
$ npm install
```

Run the environment configuration script
(if your ip address changes later you may repeat this step)

```sh
$ ./setup_env.js -i <ip address>
```

To start run
```npm start```

This runs a local webserver with the new WebUI, by default at http://localhost:4200.
If this webserver is kept running, changes to the project will be rebuilt incrementally.

To test AOT in dev mode run

```npm run start:dev:aot```

To run the production build, run

```npm run build:prod:aot```

# Translating Text to Other Languages

To extract all of the strings from the project to be translated run:
```npm run extract```

This will update all of the PO files located in the directory src/assets/i18n.
These can be edited with any PO editor.
