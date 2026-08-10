#!/usr/bin/env bash
#
# Appliance lifecycle for CI — the boundary between the suite and `ixnode`.
#
# Every call the e2e suite or its workflows make against appliance
# infrastructure goes through this file. One place, so the contract with the
# `ixnode` team is written down rather than spread across YAML, and so the day
# that contract changes is a one-file change.
#
# ─────────────────────────────────────────────────────────────────────────────
# DRAFT. The verbs below are PROPOSED, not agreed.
#
# `ixnode` today installs TrueNAS from an ISO. The team has agreed in principle
# to add snapshot and revert (Q2, 2026-08-10), but their exact shape is still to
# be settled. Everything here is a placeholder written to make the ask concrete:
# four verbs, no baseline vocabulary, no knowledge of what a baseline means.
#
# Assumed interface:
#
#   ixnode claim   --baseline <name> --json   -> {"domain","host","username","password"}
#   ixnode release <domain>
#   ixnode snapshot <domain> --name <snap> [--memory]
#   ixnode revert  <domain> --snapshot <snap>
#
# See e2e/docs/04-environment-architecture.md — E1, E5, E12.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Override to point at a real binary, or at a stub while the verbs are pending.
IXNODE="${IXNODE:-ixnode}"

die() { echo "appliance.sh: $*" >&2; exit 1; }

# Claim an appliance at a named baseline.
#
# Emits `KEY=value` lines on stdout, suitable for `>> "$GITHUB_ENV"`. Emitting
# rather than exporting keeps this usable from a workflow step, a local shell,
# and eventually the suite's own fixture.
claim() {
  local baseline="${1:?baseline name required}"
  local json
  json=$("$IXNODE" claim --baseline "$baseline" --json) \
    || die "claim failed for baseline '$baseline'"

  local domain host username password
  domain=$(jq -re '.domain' <<<"$json")   || die "claim response has no .domain"
  host=$(jq -re '.host' <<<"$json")       || die "claim response has no .host"
  username=$(jq -re '.username' <<<"$json") || die "claim response has no .username"
  password=$(jq -re '.password' <<<"$json") || die "claim response has no .password"

  # TN_* are the suite's existing contract — see .env.example and
  # e2e/support/config.ts. TN_DOMAIN and TN_BASELINE are additions this design
  # needs: the suite must know which domain to ask ixnode to revert, and which
  # baseline it is running against.
  cat <<EOF
TN_PROFILE=shipped
TN_HOST=$host
TN_USERNAME=$username
TN_PASSWORD=$password
TN_DOMAIN=$domain
TN_BASELINE=$baseline
EOF
}

# Return an appliance to the pool. Safe to call twice, and safe to call when
# claim failed — teardown runs unconditionally and must never mask the real
# failure with one of its own.
release() {
  local domain="${1:-}"
  [ -n "$domain" ] || { echo "appliance.sh: no domain to release, skipping" >&2; return 0; }
  "$IXNODE" release "$domain" || echo "appliance.sh: release of '$domain' failed" >&2
}

# Snapshot a domain. `--memory` captures RAM alongside the disks, which is what
# makes a revert seconds rather than a boot (E1). Whether it is available
# depends on the substrate; disk-only is the documented fallback.
snapshot() {
  local domain="${1:?domain required}" name="${2:?snapshot name required}" memory="${3:-memory}"
  if [ "$memory" = "memory" ]; then
    "$IXNODE" snapshot "$domain" --name "$name" --memory
  else
    "$IXNODE" snapshot "$domain" --name "$name"
  fi
}

# Revert a domain to a snapshot.
#
# NOTE for whoever wires this into the suite: reverting invalidates the
# middleware session and the worker's API connection. The caller is responsible
# for re-authenticating afterwards — see E1, "What a snapshot still does not
# fix". A revert that is not followed by re-auth will surface as a stale-socket
# failure several tests later, which is a miserable thing to debug.
revert() {
  local domain="${1:?domain required}" name="${2:?snapshot name required}"
  "$IXNODE" revert "$domain" --snapshot "$name"
}

# Collect middleware logs before the appliance is reclaimed (R7.2).
#
# Deliberately best-effort: this runs in teardown, frequently after something
# has already gone wrong, and must not turn a test failure into an
# infrastructure failure.
collect_logs() {
  local host="${1:?host required}" dest="${2:?destination directory required}"
  mkdir -p "$dest"
  # shellcheck disable=SC2029  # remote expansion is intended
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@${host}" \
    'cat /var/log/middlewared.log' > "${dest}/middlewared.log" 2>/dev/null \
    || echo "appliance.sh: could not collect middleware logs from ${host}" >&2
}

case "${1:-}" in
  claim)        shift; claim "$@" ;;
  release)      shift; release "$@" ;;
  snapshot)     shift; snapshot "$@" ;;
  revert)       shift; revert "$@" ;;
  collect-logs) shift; collect_logs "$@" ;;
  *) die "usage: appliance.sh {claim|release|snapshot|revert|collect-logs} [args]" ;;
esac
