# Harbor Framework Protocol Map

## Purpose

This document is HarborNAS-webui's local view of the HarborBeacon-centered framework and protocol map. Phase 1 is documentation only: it records the HarborOS WebUI boundary without changing Angular code, public APIs, or runtime behavior.

HarborNAS-webui is the HarborOS browser UI surface. It presents and operates HarborBeacon, Harbor Assistant, Model Center, camera/device, and HarborOS status APIs, but it does not own the underlying runtime state.

## Repository Role

HarborNAS-webui owns:

- Angular UI routes, components, services, tests, and user-facing HarborOS workflows.
- Display and operation surfaces for Harbor Assistant, Model Center, feature availability, camera/device readiness, and HarborOS status.
- Same-origin client behavior for HarborBeacon APIs exposed through HarborOS/WebUI integration.
- UI-only state such as form drafts, loading/error display, filters, and local presentation preferences.

HarborNAS-webui does not own:

- HarborBeacon task/runtime/model/policy/audit semantics.
- HarborGate IM/channel transport.
- HarborCloud entitlement/account authority.
- HarborLink MQTT connector state.
- harbor-dock Android/Paper app state.

## Shared Frame

The active collaboration frame is:

- HarborBeacon is the business-core framework.
- HarborGate is the IM/channel edge.
- HarborCloud is the cloud control plane.
- HarborLink is the Hub-side outbound connector.
- harbor-dock is the Android/Paper client surface.
- HarborNAS-webui is the HarborOS WebUI surface.

The WebUI map exists so UI display state does not drift into core runtime authority.

## Northbound Interfaces

HarborNAS-webui consumes HarborOS/Beacon APIs as a same-origin UI:

- `/api/beacon/*` and related aliases expose HarborBeacon product/admin APIs to the WebUI.
- Harbor Assistant UI uses the HarborBeacon turn contract through the supported same-origin route.
- Model Center UI presents model catalog, policy, status, and feature availability from HarborBeacon-owned APIs.
- Camera/device/readiness pages present HarborBeacon and HarborOS state without redefining device semantics.

Where assistant turn concepts are shown in the UI, the shared vocabulary remains HarborBeacon-owned: `TaskTurnEnvelope`, `conversation.handle`, `transport.route_key`, `active_frame`, `continuation`, and `delivery_hints`.

Shared HarborBeacon contract guardrails remain external authority for HarborNAS-webui: `X-Contract-Version: 2.0`, `TaskTurnEnvelope`, `conversation.handle`, `transport.route_key`, `active_frame`, `continuation`, `delivery_hints`, and the notification delivery contract.

## Core Ownership

HarborNAS-webui core ownership is presentation and interaction:

- Render HarborOS and HarborBeacon state.
- Send user actions to existing APIs.
- Preserve Angular service/component contracts and tests.
- Present loading, empty, error, permission, and degraded states.
- Avoid storing hidden copies of Beacon runtime truth as durable UI authority.

The WebUI can make HarborBeacon easier to operate; it must not become the owner of task, model, audit, approval, camera, or device execution semantics.

## Southbound Interfaces

HarborNAS-webui southbound interfaces are browser/UI dependencies:

- Same-origin HTTP calls to HarborOS and HarborBeacon API surfaces.
- Angular services, route guards, components, and test fixtures.
- Static assets and UI build pipeline.

HarborNAS-webui should not directly call HarborOS middleware, Home Assistant, RTSP/ONVIF, HarborLink MQTT, or platform IM APIs unless a specific UI integration has an owned backend API behind it.

## Build And Deployment Fit

HarborNAS-webui is the HarborOS UI package:

- Nexus / HarborOS amd64 uses WebUI same-origin integration to present HarborBeacon, Harbor Assistant, and Model Center functions.
- HarborNavi K3 riscv64 can reuse the same conceptual UI boundary if K3 product workflows expose Beacon/Navi APIs through a WebUI, but K3 local vision execution remains owned by the device/backend packages.

Angular build and test changes must not redefine HarborBeacon public contracts.

## Frozen Boundaries

- Keep UI state and presentation in HarborNAS-webui.
- Keep task/runtime/model/device semantics in HarborBeacon.
- Keep IM/channel transport in HarborGate.
- Keep cloud entitlement and identity in HarborCloud.
- Keep MQTT command/ack and home/camera connector execution in HarborLink.
- Keep Android/Paper state in harbor-dock.

## Cross-Repo References

- Bean-Harbor/HarborBeacon: `docs/harbor-framework-protocol-map.md`, `docs/HarborBeacon-Harbor-Collaboration-Contract-v2.md`, and `docs/webui-information-architecture.md`.
- Bean-Harbor/HarborGate: `docs/harbor-framework-protocol-map.md` and `docs/HarborBeacon-HarborGate-Agent-Contract-v2.0.md`.
- Bean-Harbor/HarborCloud: `docs/harbor-framework-protocol-map.md`.
- Bean-Harbor/HarborLink: `docs/harbor-framework-protocol-map.md`.
- Bean-Harbor/harbor-dock: `docs/harbor-framework-protocol-map.md`.
- HarborNAS/webui: `docs/harbor-framework-protocol-map.md` and `docs/harbor-assistant-webui-integration.md`.

## Verification Scope

For Phase 1, verify that this document keeps WebUI as presentation/operation scope, does not claim Beacon runtime authority, and passes repository diff/whitespace checks.
