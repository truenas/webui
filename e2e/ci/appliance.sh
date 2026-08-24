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
# The interface, in two halves.
#
# WORKS TODAY — `ixnode` installs TrueNAS from an ISO and hands back a machine:
#
#   ixnode claim   --baseline <name> --json   -> {"domain","host","username","password"}
#   ixnode release <domain>
#
# PROPOSED, not agreed — what the snapshot restore design needs (E1, E5):
#
#   ixnode snapshot <domain> --name <snap> [--memory]
#   ixnode revert   <domain> --snapshot <snap>
#
# The CI workflow deliberately uses only the first half, so the pipeline can be
# brought up and proven while the second half is still being discussed.
#
# One property the workflow cannot assert and this contract needs: the password
# `claim` returns must be unique to that claim, and `release` must destroy the
# appliance rather than return it to a pool. Test artifacts on a public
# repository are world-readable, and a browser trace records the password as
# typed — so it has to be worthless the moment the run ends.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Override to point at a real binary, or at a stub while the verbs are pending.
IXNODE="${IXNODE:-ixnode}"

# Where `claim` records the domain, so `release` can find it without the caller.
claimedDomainFile="appliance-domain"

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

  # Record the domain before anything else can fail.
  #
  # Between claiming an appliance and the caller having somewhere durable to put
  # the domain, a crash, a cancellation or a malformed field leaks the appliance
  # — and a leaked appliance starves the next run, which is the failure this
  # whole arrangement exists to prevent. `release` falls back to this file, so
  # the window is one line wide instead of a whole workflow step.
  if [ -n "${RUNNER_TEMP:-}" ]; then
    jq -r '.domain // empty' <<<"$json" > "${RUNNER_TEMP}/${claimedDomainFile}" 2>/dev/null || true
  fi

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

  # Fall back to what `claim` recorded. The caller usually passes `$TN_DOMAIN`,
  # but that is only set once the workflow has written the claim output into the
  # environment — and the whole point of releasing unconditionally is to cover
  # the paths where that did not happen.
  if [ -z "$domain" ] && [ -n "${RUNNER_TEMP:-}" ] && [ -f "${RUNNER_TEMP}/${claimedDomainFile}" ]; then
    domain=$(cat "${RUNNER_TEMP}/${claimedDomainFile}")
    [ -n "$domain" ] && echo "appliance.sh: releasing '$domain' recorded at claim time" >&2
  fi

  [ -n "$domain" ] || { echo "appliance.sh: no domain to release, skipping" >&2; return 0; }

  "$IXNODE" release "$domain" || echo "appliance.sh: release of '$domain' failed" >&2

  [ -n "${RUNNER_TEMP:-}" ] && rm -f "${RUNNER_TEMP}/${claimedDomainFile}"
  return 0
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
