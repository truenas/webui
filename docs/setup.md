# Setting Up Development Environment

## Requirements

- Node.js at the version in [`.node-version`](../.node-version). `fnm` and `nodenv` read that file on their own; with
  `nvm`, run `nvm install $(cat .node-version)`. Other version managers may need a setting turned on before they read
  it. Other versions that satisfy `engines` in `package.json` may work, but this is the one CI and the nightly build
  use.
- Yarn 4, through Corepack: run `corepack enable` once and the version pinned in `package.json` is used automatically.
- Running instance with TrueNAS nightly (VM is fine).

> [!TIP]
> `master` branch usually corresponds to TrueNAS nightly, but you _may_ be able to run master WebUI on non-master TrueNAS instance, if it's relatively new.

## Getting The Code
- Clone WebUI repo:

```sh
$ git clone <url of webui repo or your fork>
$ cd webui
```

- Install packages:

```sh
$ yarn
```

- Create an environment file and point it to your TrueNAS instance:

```sh
$ yarn ui remote -i <ip address or hostname of the server where TrueNAS is running>
```

> [!TIP]
> If there is something wrong with your environment file, you can reset it with `yarn ui reset` and then execute `yarn ui remote -i ` again.

## Starting the Application

- Start WebUI in development mode:

```sh
yarn start
```

- Open WebUI in your browser. By default, it's on http://localhost:4200.

## Updating Node.js

The Node.js version is pinned in one place, `.node-version`. GitHub workflows read it through
`.github/actions/prepare`, and the Debian package build (run nightly by
[scale-build](https://github.com/truenas/scale-build)) reads it in `debian/fetch_node.sh`.

To move to a new version:

1. Change the version in `.node-version`.
2. Replace both `SHA256SUM` values in `debian/fetch_node.sh` (`linux-x64` and `linux-arm64`) with the ones from
   `https://nodejs.org/dist/v<version>/SHASUMS256.txt`.
3. If the new version is outside the `engines.node` range in `package.json`, update that range too.

Step 2 is easy to forget. `.github/workflows/main.yml` runs `debian/fetch_node.sh` in a Debian container on both
architectures (the `Build` job on x64, `Fetch Node (arm64)` on arm64), so a missed checksum fails on the pull request
rather than in the nightly build.
