
FreeNAS 11 WebUI
================
[![Build Status](https://builds.ixsystems.com/jenkins/job/FreeNAS%20-%20WebUI%20Pipeline/job/master/badge/icon)](https://builds.ixsystems.com/jenkins/job/FreeNAS%20-%20WebUI%20Pipeline/job/master/)


This is the project for the new angular.io (4.x) WebUI for FreeNAS 11. It is meant to coexist with current FreeNAS 11 Django/Dojo WebUI.

# Development requirements

  - npm >= 5
  - Node.js >= 5
  - Running FreeNAS 11 Nightly Machine (VM is fine)


# Getting started

Install the development requirements (FreeBSD 11 or later):

```sh
# pkg install node6
# pkg install npm
```

On some Operating Systems it is quickest to install npm > 3 first then install npm:

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

This should open the browser with the WebUI, by default http://localhost:4200.

To test AOT in dev mode run

```npm run start:dev:aot```

To run the production build, run

```npm run build:prod:aot```

