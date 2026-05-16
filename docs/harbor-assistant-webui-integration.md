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

The dev proxy reserves `/api/harbor-assistant/**` for the Harbor Assistant
product facade hosted by HarborGate:

```text
/api/harbor-assistant/state -> http://127.0.0.1:8787/api/harbor-assistant/state -> HarborBeacon /api/state
/api/harbor-assistant/inference/healthz -> http://127.0.0.1:8787/api/harbor-assistant/inference/healthz -> HarborBeacon /api/inference/healthz
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
- All Harbor Assistant backend calls use `/api/harbor-assistant/*` and are
  routed through the HarborGate facade before reaching Beacon-owned APIs.
- Overview health reads include the HarborBeacon inference facade at
  `/api/harbor-assistant/inference/healthz`; Harbor Assistant does not call model sidecar
  ports directly.

The Search tab is the northbound user retrieval surface recovered from the
2026-04-28 VM development line:

- Source recovery checkout: `C:/Users/beanw/OpenSource/HarborNAS-webui-182-baseline`
  on branch `codex/vm-admin-mmrag-webui-r1`.
- Search is an internal Harbor Assistant tab, not a demo-only shell and not a
  separate service.
- The tab consumes the real same-origin Harbor Assistant facade:
  `POST /api/harbor-assistant/knowledge/search` and
  `GET /api/harbor-assistant/knowledge/preview`.
- The waterfall result stream merges documents, images, and videos, and keeps
  evidence fields such as `content_source_kinds`, `content_indexed`,
  `content_match_used`, and `filename_match_used` visible so live testing can
  prove retrieval is not a filename shortcut.

The old standalone HarborBeacon `frontend/harbor-assistant` remains a temporary API
validation shell and should not receive new product UI work.

## Ownership boundaries

- Harbor Assistant uses HarborOS WebUI login and layout.
- Harbor Assistant owns the admin/configuration operator surface.
- Search owns the user-facing multimodal retrieval surface inside Harbor Assistant.
- HarborBeacon owns Harbor Assistant admin API, approvals, artifacts, audit, and
  business settings state.
- HarborGate owns IM credentials, platform transport, setup URLs, and redacted
  connector status.
- AIoT device management remains in the AIoT lane and is not part of HarborOS
  System Domain control.
