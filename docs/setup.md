# Setting Up Development Environment

## Requirements

- [ ] yarn >= 1.22
- [ ] Node.js >= 18.19.1
- [ ] Running instance with TrueNAS nightly (VM is fine).

> [!TIP]
> `master` branch usually corresponds to TrueNAS nightly, but you _may_ be able to run master WebUI on non-master TrueNAS instance, if it's relatively new.

## Getting The Code
- [ ] Clone WebUI repo:

```sh
$ git clone <url of webui repo or your fork>
$ cd webui
```

- [ ] Install packages:

```sh
$ yarn
```

- [ ] Create an environment file and point it to your TrueNAS instance:

```sh
$ yarn ui remote -i <ip address or hostname of the server where TrueNAS is running>
```

> [!TIP]
> If there is something wrong with your environment file, you can reset it with `yarn ui reset` and then execute `yarn ui remote -i ` again.

## Starting the Application

- [ ] Start WebUI in development mode:

```sh
yarn start
```

- [ ] Open WebUI in your browser. By default, it's on http://localhost:4200.



