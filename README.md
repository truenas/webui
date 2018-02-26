
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

# Locale Translations

To contribute to the internationalization of this project we recommend using the i18n-editor utility, click here to download the latest version from here, get the .zip file containing the executables from here:

https://github.com/jcbvm/i18n-editor/releases/latest

This program requires Java JRE version 1.8 or higher installed, for Windows and Mac go here to get it: https://www.java.com/, for other operating systems see your OS's documentation on how to install Java JRE 1.8 or higher.

Unzip the contents in a convenient location and execute the application, if you are using Windows or Macintosh simply run the executable for your platform.  For other operating systems such as TrueOS, FreeBSD or Linux execute the .jar file like such:

$ java -jar i18n-editor.jar

For more information on this application see their main page:

https://github.com/jcbvm/i18n-editor

After you have started the application to begin editing strings do the following:

1) Click File > Import Project
2) Browse to the folder that contains the cloned git repo for the webui
3) Within the webui folder browse to the directory "src" then "assets" then "i18n" (src/assets/i18n) and click Open
4) You should then be displayed with all of the strings within the application and their language translations.
5) To save simply click File > Save
6) Finally make a pull request with your changes and then we will review it :)