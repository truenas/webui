# HarborDesk / HarborBot WebUI Integration

HarborDesk is developed as a native HarborOS WebUI module in this repository.
HarborBot is developed as the parallel native user retrieval page.
HarborBeacon remains the owner of the HarborDesk admin API and business state.

## Local checkout

Use an independent checkout instead of copying WebUI sources into HarborBeacon:

```bash
git clone https://github.com/HarborNAS/webui.git C:/Users/beanw/OpenSource/HarborNAS-webui
cd C:/Users/beanw/OpenSource/HarborNAS-webui
git checkout -b feature/harbordesk-settings
```

## Development proxy

The dev proxy reserves `/api/harbordesk/**` for the unified HarborBeacon API:

```text
/api/harbordesk/state -> http://127.0.0.1:4174/api/state
/api/harbordesk/inference/healthz -> http://127.0.0.1:4174/api/inference/healthz
```

Run `harborbeacon.service` or the unified `harborbeacon-service` binary on
`127.0.0.1:4174` before testing HarborDesk. The normal HarborOS `/api/**`
proxy remains separate.

## Current slice

`/ui/harbordesk` now contains the first customer Settings slice:

- Overview for HarborOS principal, writable root, default CIDR, default camera,
  and same-origin HarborBeacon connectivity.
- Devices & AIoT management for discovery scan, manual device add, default
  camera selection, RTSP checks, snapshot checks, share-link create/revoke, and
  device credential configured/redacted status.
- All HarborDesk backend calls use `/api/harbordesk/*` and are rewritten by the
  dev proxy to the HarborBeacon single-port API.
- Overview health reads include the HarborBeacon inference facade at
  `/api/harbordesk/inference/healthz`; HarborDesk does not call model sidecar
  ports directly.

`/ui/harborbot` is the northbound user retrieval surface recovered from the
2026-04-28 VM development line:

- Source recovery checkout: `C:/Users/beanw/OpenSource/HarborNAS-webui-182-baseline`
  on branch `codex/vm-admin-mmrag-webui-r1`.
- HarborBot is a native WebUI page at `src/app/pages/harborbot/`, not a
  demo-only shell and not a separate service.
- The page consumes the real same-origin HarborBeacon knowledge API:
  `POST /api/harbordesk/knowledge/search` and
  `GET /api/harbordesk/knowledge/preview`.
- The waterfall result stream merges documents, images, and videos, and keeps
  evidence fields such as `content_source_kinds`, `content_indexed`,
  `content_match_used`, and `filename_match_used` visible so live testing can
  prove retrieval is not a filename shortcut.

The old standalone HarborBeacon `frontend/harbordesk` remains a temporary API
validation shell and should not receive new product UI work.

## Ownership boundaries

- HarborDesk uses HarborOS WebUI login and layout.
- HarborDesk owns the admin/configuration operator surface.
- HarborBot owns the user-facing multimodal retrieval surface.
- HarborBeacon owns HarborDesk admin API, approvals, artifacts, audit, and
  business settings state.
- HarborGate owns IM credentials, platform transport, setup URLs, and redacted
  connector status.
- AIoT device management remains in the AIoT lane and is not part of HarborOS
  System Domain control.
