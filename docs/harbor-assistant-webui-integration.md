# Harbor Assistant WebUI Integration

Harbor Assistant is developed as the only native HarborOS WebUI module for this
surface. Search, camera, messaging, and settings are internal tabs of the same
entry. HarborBeacon remains the owner of the Harbor Assistant admin API and
business state.

## Local checkout

Use an independent checkout instead of copying WebUI sources into HarborBeacon:

```bash
git clone https://github.com/HarborNAS/webui.git C:/Users/beanw/OpenSource/HarborNAS-webui
cd C:/Users/beanw/OpenSource/HarborNAS-webui
git checkout -b feature/harbor-assistant-settings
```

## Development proxy

The HarborBeacon WebUI entry is `/api/beacon/*`. The older
`/api/harbor-beacon/*` service prefix remains a compatibility alias for older
WebUI builds and ISO nginx entries, but current Harbor Assistant code should not
add new product dependency on that legacy name.

The dev proxy reserves service-level entries for the local Harbor services:

```text
/api/beacon/state -> http://127.0.0.1:4174/api/beacon/state -> HarborBeacon /api/state
/api/beacon/inference/healthz -> http://127.0.0.1:4174/api/beacon/inference/healthz -> HarborBeacon /api/inference/healthz
/api/harbor-beacon/state -> http://127.0.0.1:4174/api/harbor-beacon/state -> HarborBeacon /api/state
/api/harbor-beacon/inference/healthz -> http://127.0.0.1:4174/api/harbor-beacon/inference/healthz -> HarborBeacon /api/inference/healthz
/api/harbor-gate/setup/weixin -> http://127.0.0.1:8787/api/harbor-gate/setup/weixin -> HarborGate setup page
```

Run `harboros-beacon.service` on `127.0.0.1:4174` and
`harboros-im-gate.service` on `127.0.0.1:8787` before testing Harbor Assistant.
The normal HarborOS `/api/**` proxy remains separate.

## Current slice

`/ui/harbor-assistant` contains the customer-facing Harbor Assistant surface:

- Overview for HarborOS principal, writable root, default CIDR, default camera,
  and same-origin HarborBeacon connectivity.
- Devices & AIoT management for discovery scan, manual device add, default
  camera selection, RTSP checks, snapshot checks, share-link create/revoke, and
  device credential configured/redacted status.
- Home Assistant bridge setup for read-only connection status, token test,
  entity sync, exposed domains, and managed Container install lifecycle.
- Harbor Assistant backend data calls use `/api/beacon/*` as the stable product
  prefix. `/api/harbor-beacon/*` remains a compatibility alias handled by
  Beacon-owned APIs for older WebUI builds and ISO entries.
- IM setup and management links use `/api/harbor-gate/*`, keeping Gate-owned
  browser/admin pages under the HarborGate service entry.
- Overview health reads include the HarborBeacon inference API through the
  Beacon same-origin prefix; Harbor Assistant does not call model sidecar ports
  directly.

The Search tab is the northbound user retrieval surface recovered from the
2026-04-28 VM development line:

- Source recovery checkout: `C:/Users/beanw/OpenSource/HarborNAS-webui-182-baseline`
  on branch `codex/vm-admin-mmrag-webui-r1`.
- Search is an internal Harbor Assistant tab, not a demo-only shell and not a
  separate service.
- The tab consumes the real same-origin HarborBeacon service entry. The stable
  target prefix is `/api/beacon/*`; `/api/harbor-beacon/*` is a legacy alias for
  older WebUI and nginx configurations.
- The waterfall result stream merges documents, images, and videos, and keeps
  evidence fields such as `content_source_kinds`, `content_indexed`,
  `content_match_used`, and `filename_match_used` visible so live testing can
  prove retrieval is not a filename shortcut.

The old standalone HarborBeacon `frontend/harbor-assistant` remains a temporary API
validation shell and should not receive new product UI work.

## Package handoff

The current HarborAssistant package handoff id is
`harborassistant-live-solidify-20260529`.

The WebUI side of that handoff is:

- source prefix: `/ui/harbor-assistant`
- package path: `/usr/share/truenas/webui`
- Beacon API prefix: `/api/beacon/*`
- Beacon compatibility alias: `/api/harbor-beacon/*`
- Gate API prefix: `/api/harbor-gate/*`

The live hotfix path `/mnt/.ix-apps/harbor-webui-live/current` is rollback
evidence only. A successful package install must not require that symlink or a
manual nginx patch to serve HarborAssistant.

The central offline package/runbook evidence lives in the HarborBeacon repo at
`docs/harbor-assistant-offline-delivery-runbook.md`; the WebUI live matrix keeps
the WebUI-facing validation row in
`docs/harbor-assistant-live-e2e-matrix.md`.

## Ownership boundaries

- Harbor Assistant uses HarborOS WebUI login and layout.
- Harbor Assistant owns the admin/configuration operator surface.
- Search owns the user-facing multimodal retrieval surface inside Harbor Assistant.
- HarborBeacon owns Harbor Assistant admin API, approvals, artifacts, audit, and
  business settings state.
- HarborGate owns IM credentials, platform transport, setup URLs, and redacted
  connector status.
- HarborCloud owns account, entitlement, Hub identity, WebRTC signaling, and
  cloud metadata; HarborLink owns Hub-side MQTT and Home Assistant/camera bridge
  execution.
- Harbor Assistant/WebUI must not own HarborBeacon runtime state, HarborCloud
  entitlement, HarborLink MQTT, HarborDock UI intent, or HarborGate transport
  semantics.
- AIoT device management remains in the AIoT lane and is not part of HarborOS
  System Domain control.
