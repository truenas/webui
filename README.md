FreeNAS 11 WebUI
================

This is the project for the new angular.io (4.x) WebUI for FreeNAS 11. It is meant to coexist with current FreeNAS 11 Django/Dojo WebUI.

# Development requirements

  - npm 3
  - Node.js >= 5
  - Running FreeNAS 11 Nightly (Virtual?) Machine


# Getting started

Install the development requirements (FreeBSD):

```sh
# pkg install node6
# pkg install npm3
```

On some Operating Systems it is quickest to install npm > 3 first then install npm:

```sh
# npm install -g npm3
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

Start development server pointing to your FreeNAS machine (in this example, address is 192.168.0.50):

Edit the environment file 
```
src/environments/environment.ts
export const environment = {
  host: '192.168.0.50',
  port:  4200,
  server: '192.168.0.50',
  remote: '192.168.0.50',
  production: false
};
```
then edit the ip address in the proxy.config.json
```
proxy.config.json
{
    "/api/*": {
        "target": "http://192.168.0.50",
        "secure": false,
        "loglevel": "debug"
    }
}
```

To start run 
```npm start```


This should open the browser with the WebUI, by default http://localhost:4200.
