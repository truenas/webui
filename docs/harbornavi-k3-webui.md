# HarborNavi K3 Assistant WebUI

HarborNavi is a standalone K3 product path. It reuses the Harbor Assistant
WebUI code from this repository, but it is compiled, packaged, and deployed as
its own K3 artifact.

## Runtime Boundary

- HarborNavi WebUI runs on the K3 hub.
- The K3 package installs static assets under `/usr/share/harbornavi/webui`.
- nginx serves the page at `/ui/harbor-assistant`.
- `/api/beacon/*` is proxied to the K3-local `harboros-beacon.service` on
  `127.0.0.1:4174`.
- `/api/harbor-gate/*` is optional and proxies to `127.0.0.1:8787` when Gate is
  present. K3 without Gate should show unavailable state instead of failing the
  page.

`.82` is a Nexus/HarborOS experiment host or replay source. It is not the
HarborNavi WebUI host and should not be used as the HarborNavi Assistant
runtime target.

## Build

```bash
yarn build:harbornavi-k3
bash scripts/harbornavi-k3/build-deb.sh
```

The HarborNavi build profile replaces the full HarborOS shell with a minimal
K3 route table. It bypasses the TrueNAS middleware websocket, `/api/current`,
and `/signin` guard so the K3 page can open directly into Harbor Assistant.

## Install Shape

- Package: `harbornavi-assistant-webui`
- Architecture: `all`
- Web root: `/usr/share/harbornavi/webui`
- nginx config: `/etc/nginx/conf.d/harbornavi-webui.conf`
- Page: `http://<k3-host>/ui/harbor-assistant`
- Beacon API: `http://<k3-host>/api/beacon/*`

Do not place HA tokens, RTSP URLs, camera credentials, API keys, private keys,
local snapshot paths, or image bytes in the bundle, nginx config, or logs.
