# Harbor Assistant Live E2E Matrix

This matrix is the HarborNAS-webui tracking record for restoring
`/ui/harbor-assistant` as a real HarborOS surface. The goal is product function,
not general lint cleanup.

## Scope

In scope for this round:

- HarborNAS-webui Harbor Assistant UI and same-origin adapters.
- HarborBeacon `/api/beacon/*` admin/product APIs.
- HarborGate `/api/harbor-gate/*` setup, manage, status, and notification entry
  points.

Out of scope for this round:

- HarborCloud, HarborLink, and harbor-dock implementation changes.
- Large Harbor Assistant component refactors.
- Global lint debt that does not block build, tests, or a touched live path.

## Entry Rules

- Current HarborBeacon WebUI entry: `/api/beacon/*`.
- Compatibility Beacon alias: `/api/harbor-beacon/*`.
- Current HarborGate WebUI entry: `/api/harbor-gate/*`.
- Harbor Assistant page entry: `/ui/harbor-assistant`.
- All write tests must use temporary names or short-lived resources, and the
  verifier should clean up temporary notification targets, share links, model
  endpoints, and short recordings when the backend exposes cleanup.

## Validation Runs

| Date | Target | Kind | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-28 | local checkout | static/unit/build | pass | `corepack yarn test src/app/pages/harbor-assistant --runInBand` passed with 75 tests; `corepack yarn check:harbor-assistant-i18n` and `corepack yarn build:prod` passed. |
| 2026-05-28 | HarborOS host `192.168.3.82` | live API | fixed | Added live nginx `/api/beacon/* -> 127.0.0.1:4174`; deployed Beacon hash `8bf1461c03a3d43bfe3a535b214085e0944a1ccf75395c4430f62e3590d16b27` from Apps dataset live-bin; `/api/beacon/state`, `/api/beacon/inference/healthz`, `/api/beacon/automation/reviews`, Gate setup/manage, camera, DVR, preview, and model download/cancel smoke passed. |
| 2026-05-28 | HarborOS host `192.168.3.82` | live storage recovery | fixed | Root boot-pool was full, which truncated `admin-console.json`; moved Beacon live binary and admin state to `Apps disk`, added atomic Beacon state writes, and rerouted DVR/Knowledge roots to `Apps disk`. |
| 2026-05-28 | HarborOS host `192.168.3.82` | Home Assistant install | fixed | Recovered root/var metadata pressure by moving `/mnt/software` to `Apps disk` with a compatibility symlink and moving `/var/lib/containerd` to `/mnt/.ix-apps/containerd`; pulled `ghcr.io/home-assistant/home-assistant:stable`, installed `harbor-home-assistant`, and verified `http://192.168.3.82:8123` returns HTTP 200. |
| 2026-05-29 | HarborOS host `192.168.3.82` | Home Assistant onboarding account | fixed | Created the initial owner account `harbor_admin` / `Harbor Admin` through HA onboarding API and verified authenticated `/api/` returns `API running.`; remaining HA onboarding steps are `core_config`, `analytics`, and `integration`. |
| 2026-05-29 | HarborOS host `192.168.3.82` | Home Assistant Beacon link | fixed | Completed HA onboarding, set core config to `Harbor Home`, `Asia/Shanghai`, metric/CNY, created a HarborBeacon long-lived token, saved Beacon HA config with `http://127.0.0.1:8123`, and verified `test=connected`, `sync=synced`, 10 entities, and 60 service domains. |
| 2026-05-29 | HarborOS host `192.168.3.82` | Home Assistant WebUI browser | fixed | Deployed the rebuilt WebUI dist to `/mnt/.ix-apps/harbor-webui-live/current` via nginx after backing up config, corrected HA metrics to show 60 service domains and 241 services separately, formatted Last sync as local time, and browser-verified Save, Test connection, Sync entities, and Install plan with no console or HA API errors. |
| 2026-05-29 | HarborOS host `192.168.3.82` | live browser surface | pass | Browser-smoked current `/ui/harbor-assistant` Search, Camera, Message connections, Home Assistant, Settings, and Models subtab. No console errors, no `/api/beacon` or `/api/harbor-gate` 4xx/5xx responses, Gate setup/manage/status same-origin entries returned 200, and Models rendered model storage, runtime manager, and capability rows. |
| 2026-05-29 | HarborOS host `192.168.3.82` | rules live write | pass | Created temporary automation review `codex-live-rule-20260529`, then enabled, paused, and discarded it through `/api/beacon/automation/reviews/*`; all calls returned 200 and pending count returned to 0. |
| 2026-05-29 | HarborOS host `192.168.3.82` | knowledge/search live | pass | `/api/beacon/knowledge/search` returned indexed video and image results for live DVR media; preview guard returned HTTP 200 `video/mp4` for a recording and `image/jpeg` for a snapshot. Document search empty result stayed a clean completed empty state. |
| 2026-05-29 | HarborOS host `192.168.3.82` + camera `192.168.3.231` | camera/DVR live write | pass | TP1 remained the default camera. Device validation passed RTSP and snapshot checks; RTSP check returned reachable over redacted `/stream2`; snapshot image returned HTTP 200 `image/jpeg`; snapshot task completed; a 15s recording produced a playable 127690-byte MP4; timeline and preview returned HTTP 200 `video/mp4`; a temporary share link was created and revoked, leaving 0 active links. |
| 2026-05-29 | HarborOS host `192.168.3.82` | models live read/write | pass | Models API returned 6 endpoints and 4 runtime slots; Harbor Candle runtime was active/installed and install was idempotent HTTP 200. Route policies round-tripped unchanged, local downloads listed `ready` with no blockers, and the embedding endpoint test returned `ok=true` / HTTP 200. |
| 2026-05-30 | package/release lane | offline solidification | pass | Artifact id `harborassistant-live-solidify-20260529` built on `.197` under `/home/harbor-innovations/artifacts/harborassistant-live-solidify-20260529/output`. `SHA256SUMS` passed for Beacon, Gate, WebUI deb, and WebUI dist tar. Deb dry checks confirmed Beacon/Gate binaries and systemd units, Beacon Candle bootstrap model, WebUI `/usr/share/truenas/webui/index.html`, and WebUI dist refs `/api/beacon=70`, `/api/harbor-gate=4`, `/api/harbor-beacon=2`, `/api/harbor-assistant=0`. Central runbook: `HarborBeacon/docs/harbor-assistant-offline-delivery-runbook.md`. |
| 2026-05-30 | build-host `.197` -> HarborOS `.82` | network blocker | blocked | `.197` routes `192.168.3.82` via `192.168.1.1`, but ping had 0/3 replies and TCP `22/80/443/4174/8787` timed out. SSH jump local -> `.197` -> `.82:22` timed out. Live package install and browser acceptance are deferred until SSH/HTTP reachability returns from `.197` or another confirmed jump host. |
| 2026-05-28 | HarborOS host `192.168.3.82` | browser | partial | Browser opened and navigated Harbor Assistant before service restarts with no console errors across Camera, Gate, Home Assistant, and Settings. After restarts the UI returned to `/ui/signin`; the Codex browser plugin could not type credentials because its virtual clipboard was unavailable, so final post-fix tab verification is API-level. |

## Live Smoke Checklist

Record each live row with:

- Entry: page route, tab, or API endpoint.
- Operation: exact click/action/request.
- Expected: product behavior.
- Actual: observed result, HTTP code, console error, or blocker text.
- Evidence: screenshot, log line, or command output reference.
- Fix repo: `HarborNAS-webui`, `HarborBeacon`, `HarborGate`, or `blocked`.
- Result: `pass`, `fixed`, `unavailable`, or `failed`.

### Overview

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Page load | `/ui/harbor-assistant` | Open page | Harbor Assistant loads without console errors or 404s. | pass |
| Beacon status | `/api/beacon/state` | Refresh overview | Beacon state is readable or shows actionable unavailable state. | fixed |
| Gate status | `/api/beacon/gateway/status` | Refresh overview | Gate status is readable through Beacon projection. | fixed |
| Model status | `/api/beacon/models/endpoints` | Refresh overview | Active endpoints and policy summary render. | fixed |
| Hardware status | `/api/beacon/hardware/readiness` | Refresh overview | Hardware readiness renders. | pass |
| Default camera | `/api/beacon/state` | Refresh overview | Default camera status renders. | fixed |
| Knowledge status | `/api/beacon/rag/readiness` | Refresh overview | Knowledge readiness renders. | fixed |

### Models

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Runtime manager | `/api/beacon/models/runtimes` | Open Models tab | Runtime list renders with install state. | pass |
| Runtime install | `/api/beacon/models/runtimes/:id/install` | Install supported runtime | Install starts or returns actionable unavailable reason. | pass |
| Endpoint save | `/api/beacon/models/endpoints` | Add or update temporary endpoint | Endpoint persists and refreshes. | pass |
| Capability selection | `/api/beacon/models/capabilities/:id/selection` | Change a capability selection | Selection persists and UI updates. | pass |
| Policy save | `/api/beacon/models/policies` | Save model policy | Policy persists and reloads. | pass |
| Model test | `/api/beacon/models/endpoints/:id/test` | Run endpoint test | Test result is visible with success or recoverable error. | pass |
| Download start | `/api/beacon/models/local-downloads` | Start tiny/smoke download if available | Job appears in download list. | fixed |
| Download cancel | `/api/beacon/models/local-downloads/:job_id/cancel` | Cancel temporary job | Job reports canceled or finished. | fixed |

### Knowledge And Search

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Source settings | `/api/beacon/knowledge/settings` | Save temporary source settings | Settings persist or show actionable invalid path reason. | fixed |
| File browser | `/api/beacon/files/browse` | Browse a known path | Directory listing renders or permission blocker renders. | pass |
| Index start | `/api/beacon/knowledge/index/run` | Start index | Job starts or explicit dependency blocker is shown. | fixed |
| Index status | `/api/beacon/knowledge/index/status` | Poll status | Current index state renders. | fixed |
| Document search | `/api/beacon/knowledge/search` | Search text query | Document results render with evidence fields. | pass |
| Image search | `/api/beacon/knowledge/search` | Search visual query | Image results render or VLM dependency blocker renders. | pass |
| Video search | `/api/beacon/knowledge/search` | Search video query | Video results render or dependency blocker renders. | pass |
| Preview URL | `/api/beacon/knowledge/preview` | Open result preview | Preview returns content or actionable unavailable state. | fixed |

### Cameras And DVR

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Discovery | `/api/beacon/discovery/scan` | Run scan | Devices appear or network scope blocker renders. | pass |
| Manual add | `/api/beacon/devices/manual` | Add temporary camera/device | Device appears and can be edited/deleted. | fixed |
| Credentials | `/api/beacon/devices/:id/credentials` | Save temporary credentials | Credential status becomes configured/redacted. | fixed |
| RTSP check | `/api/beacon/devices/:id/rtsp-check` | Check main camera RTSP | Check succeeds or clear camera blocker renders. | pass |
| Snapshot task | `/api/beacon/cameras/:id/snapshot` | Trigger snapshot | Snapshot artifact or recoverable error is visible. | pass |
| Snapshot image | `/api/beacon/cameras/:id/snapshot.jpg` | Open image refresh | JPEG image returns or clear blocker renders. | pass |
| Default camera | `/api/beacon/devices/default-camera` | Set default camera | Default camera state persists. | pass |
| Recording settings | `/api/beacon/cameras/recording-settings` | Save short recording settings | Settings persist. | fixed |
| Start recording | `/api/beacon/cameras/:id/recordings/start` | Start short recording | Recording starts or returns actionable blocker. | pass |
| Stop recording | `/api/beacon/cameras/:id/recordings/stop` | Stop short recording | Recording stops and status updates. | pass |
| Timeline | `/api/beacon/cameras/recordings/timeline` | Refresh timeline | Recent clip appears or empty state is accurate. | pass |
| Share link | `/api/beacon/cameras/:id/share-link` | Create temporary share | Link is created and visible. | pass |
| Revoke link | `/api/beacon/share-links/:id/revoke` | Revoke temporary share | Link is revoked and no longer usable. | pass |

### Home Assistant

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Status | `/api/beacon/home-assistant/status` | Open Home Assistant tab | Status renders. | pass |
| Config save | `/api/beacon/home-assistant/config` | Save temporary config or unchanged config | Config persists or validates with clear blocker. | fixed |
| Test | `/api/beacon/home-assistant/test` | Run connection test | Success or actionable connection error renders. | fixed |
| Sync | `/api/beacon/home-assistant/sync` | Sync entities | Entities update or dependency blocker renders. | fixed |
| Entities | `/api/beacon/home-assistant/entities` | Refresh entities | Entity list renders. | fixed |
| Services | `/api/beacon/home-assistant/services` | Refresh services | Service list renders. | fixed |
| Install status | `/api/beacon/harboros/apps/home-assistant/status` | Refresh install state | Managed app state renders. | pass |
| Install plan | `/api/beacon/harboros/apps/home-assistant/install-plan` | Generate plan | Plan renders or unsupported blocker renders. | pass |
| Install | `/api/beacon/harboros/apps/home-assistant/install` | Execute install when safe | fixed |

### IM And Gate

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Weixin setup page | `/api/harbor-gate/setup/weixin` | Open from UI | Same-origin page loads. | pass |
| Weixin manage page | `/api/harbor-gate/admin/im/weixin` | Open from UI | Same-origin page loads. | pass |
| Feishu setup page | `/api/harbor-gate/setup/feishu` | Open from UI | Same-origin page loads. | pass |
| Gateway status | `/api/harbor-gate/api/setup/status` | Refresh Gate status | Redacted status renders. | pass |
| Notification targets | `/api/beacon/admin/notification-targets` | Refresh targets | Targets render. | pass |
| Set default target | `/api/beacon/admin/notification-targets/default` | Set temporary/default target | Default target persists. | unavailable |
| Delete target | `/api/beacon/admin/notification-targets/:id` | Delete temporary target | Target is removed. | unavailable |

### Automation And Rules

| Feature | Entry | Operation | Expected | Result |
| --- | --- | --- | --- | --- |
| Review list | `/api/beacon/automation/reviews` | Open rules view | Reviews render or explicit unavailable state renders. | fixed |
| Draft | `POST /api/beacon/automation/reviews` | Draft rule when available | Draft is created or blocker is explicit. | fixed |
| Enable | `/api/beacon/automation/reviews/:id/enable` | Enable draft/test review | Rule state becomes enabled. | fixed |
| Pause | `/api/beacon/automation/reviews/:id/pause` | Pause enabled rule | Rule state becomes paused. | fixed |
| Discard | `/api/beacon/automation/reviews/:id/discard` | Discard temporary review | Review is discarded. | fixed |

## Current Local Findings

- Harbor Assistant source now calls Beacon through `/api/beacon/*`.
- Gate setup/manage URLs stay under `/api/harbor-gate/*`.
- WebUI dev proxy and packaged nginx both reserve `/api/beacon/*` for
  HarborBeacon and `/api/harbor-gate/*` for HarborGate.
- Automation review calls now have a Beacon-owned management surface for list,
  draft, enable, pause, and discard actions.
- Live nginx on `192.168.3.82` now has `/api/beacon/*` as the active Beacon
  same-origin route. `/api/harbor-beacon/*` remains a compatibility alias.
- Root boot-pool pressure was resolved without deleting the old `/mnt/software`
  cache: `/mnt/software` now points to `Apps disk/software`, and Docker's
  containerd metadata path now points to `/mnt/.ix-apps/containerd`.
- Home Assistant install now succeeds through the product API. The live host
  pulled `ghcr.io/home-assistant/home-assistant:stable`, created the
  `harbor-home-assistant` container, exposed port `8123`, and returned HTTP 200
  from the HA onboarding page. Entity sync remains unavailable until HA
  onboarding is finished and HarborBeacon is configured with a long-lived token.
- The HA initial owner account step is complete for `harbor_admin` / `Harbor
  Admin`, and all HA onboarding steps now report `done=true`.
- HarborBeacon has a dedicated HA long-lived token stored through the redacted
  Home Assistant config path. Live verification returned `connected` for test
  and `synced` for sync, with 10 entities and 60 service domains visible.
- The HA dashboard metric row now separates service domains from services:
  browser validation saw `Entities=10`, `Service domains=60`,
  `Services=241`, and `Version=2026.5.4`.
- Last sync is formatted as local browser time instead of exposing the raw Unix
  timestamp string.
- Package delivery is now tracked by artifact id
  `harborassistant-live-solidify-20260529`; the live hotfix remains rollback
  evidence only and should not be required after package install succeeds.
- Current live blocker is network reachability, not WebUI API path drift:
  `.197` cannot currently reach `.82` on SSH or HTTP.
- Notification target default/delete requires an existing target. The empty
  target list renders correctly; create/upsert is still Gateway-service owned,
  not a direct HarborAssistant button.
- DVR recording initially produced 0-byte MP4s because the camera exposes
  `pcm_alaw` audio and the old ffmpeg command copied optional audio into MP4.
  Beacon now records video-only for the DVR MP4 path; a live 13.37s MP4 passed
  `ffprobe`, and preview returned `video/mp4`.
