#!/usr/bin/env bash
#
# Appliance lifecycle for CI — the boundary between the suite and the lab.
#
# Every call the e2e suite or its workflows make against appliance
# infrastructure goes through this file. One place, so the contract with the
# lab is written down rather than spread across YAML, and so the day that
# contract changes is a one-file change.
#
# ─────────────────────────────────────────────────────────────────────────────
# The provisioner is `tn_guest.py` from iXsystems/api-ci-testbed.
#
# The lab runner is itself a TrueNAS box. tn_guest.py drives that box's own
# middleware API to install a nested TrueNAS VM from an ISO, sets the admin
# password during install, and prints connection details as JSON. The browser
# runs in a container on the same box with host networking, so it reaches the
# guest exactly as the host does. This is the layout tn_guest.py was written
# for — see jenkins/tn_guest_setup.md in that repository.
#
# Networking is `hostfwd`: the guest sits behind QEMU user-mode NAT and its
# ports 80 and 443 are forwarded to a per-deployment port pair on the host. So
# the appliance address the suite gets is `<host>:<https port>`, and nothing
# but HTTP(S) reaches the guest — no SSH, hence no middleware log collection
# in this mode.
#
# Verbs used:
#
#   tn_guest.py create --host H --pool P (--api-key K | --password W)
#                      --iso <path on host> --admin-pass <generated>
#                      --nickname <name> --lifetime <duration>   -> JSON
#   tn_guest.py delete --host H --pool P (...) <name or nickname>
#
# Snapshot and revert (E1, E5 in the design) have no equivalent here yet.
#
# Configuration, all environment variables:
#
#   TN_GUEST            path to tn_guest.py
#   TN_GUEST_PYTHON     interpreter with truenas_api_client installed
#   TN_GUEST_HOST       the TrueNAS host to create VMs on (default: localhost)
#   TN_GUEST_POOL       pool on that host for VM datasets and zvols
#   TN_GUEST_ISO        install ISO, as a path on the host under /mnt/<pool>/…
#   TN_GUEST_HOST_USER  API user on the host (default: root)
#   TN_GUEST_HOST_API_KEY or TN_GUEST_HOST_PASSWORD — credential for that user
#   TN_GUEST_LIFETIME   VM lifetime, so a leaked one expires (default: 3h)
#
# Guest sizing, all with defaults below. The host is shared with the runner,
# Docker and the browser, so these are deliberately smaller than tn_guest.py's
# own defaults (8GB, 32GB OS disk, ten data disks):
#
#   TN_GUEST_MEMORY_MB, TN_GUEST_VCPUS, TN_GUEST_OS_DISK_GB,
#   TN_GUEST_DATA_DISK_COUNT, TN_GUEST_DATA_DISK_GB
#
# The password `claim` sets on the guest is generated per claim, and `release`
# destroys the guest. Test artifacts on a public repository are world-readable
# and a browser trace records the password as typed, so it has to be worthless
# the moment the run ends. This is what makes uploading traces safe later.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

TN_GUEST="${TN_GUEST:-/mnt/tank/github/api-ci-testbed/jenkins/scripts/tn_guest.py}"
TN_GUEST_PYTHON="${TN_GUEST_PYTHON:-/mnt/tank/github/venv/bin/python3}"
TN_GUEST_HOST="${TN_GUEST_HOST:-localhost}"
TN_GUEST_POOL="${TN_GUEST_POOL:-tank}"
TN_GUEST_HOST_USER="${TN_GUEST_HOST_USER:-root}"
TN_GUEST_LIFETIME="${TN_GUEST_LIFETIME:-3h}"
TN_GUEST_MEMORY_MB="${TN_GUEST_MEMORY_MB:-6144}"
TN_GUEST_VCPUS="${TN_GUEST_VCPUS:-4}"
TN_GUEST_OS_DISK_GB="${TN_GUEST_OS_DISK_GB:-10}"
TN_GUEST_DATA_DISK_COUNT="${TN_GUEST_DATA_DISK_COUNT:-1}"
TN_GUEST_DATA_DISK_GB="${TN_GUEST_DATA_DISK_GB:-10}"

# Where `claim` records the deployment name, so `release` can find it without
# the caller.
claimedNameFile="appliance-name"

die() { echo "appliance.sh: $*" >&2; exit 1; }

# Run one tn_guest.py verb with the common prefix every verb needs: which
# host, which pool, which credential.
tnGuest() {
  local verb="$1"; shift
  local args=(--host "$TN_GUEST_HOST" --pool "$TN_GUEST_POOL" --user "$TN_GUEST_HOST_USER")
  if [ -n "${TN_GUEST_HOST_API_KEY:-}" ]; then
    args+=(--api-key "$TN_GUEST_HOST_API_KEY")
  elif [ -n "${TN_GUEST_HOST_PASSWORD:-}" ]; then
    args+=(--password "$TN_GUEST_HOST_PASSWORD")
  else
    die "TN_GUEST_HOST_API_KEY or TN_GUEST_HOST_PASSWORD is required"
  fi
  "$TN_GUEST_PYTHON" "$TN_GUEST" "$verb" "${args[@]}" ${@+"$@"}
}

checkTools() {
  [ -x "$TN_GUEST_PYTHON" ] || die "TN_GUEST_PYTHON is not executable: $TN_GUEST_PYTHON"
  [ -f "$TN_GUEST" ] || die "TN_GUEST not found: $TN_GUEST"
  command -v jq > /dev/null || die "jq is required"
}

# Claim an appliance at a named baseline.
#
# Emits `KEY=value` lines on stdout, suitable for `>> "$GITHUB_ENV"`. Emitting
# rather than exporting keeps this usable from a workflow step, a local shell,
# and eventually the suite's own fixture. Everything else goes to stderr.
claim() {
  local baseline="${1:?baseline name required}"
  # tn_guest.py installs from an ISO every time, so a clean install is the
  # only baseline it can produce. Anything else is the snapshot design (E5).
  [ "$baseline" = "fresh-install" ] \
    || die "baseline '$baseline' is not available: tn_guest.py can only produce 'fresh-install'"
  checkTools

  # The ISO is a path on the host. When the host is this machine, which is the
  # layout this pipeline runs in, check it here rather than letting tn_guest.py
  # create a VM and find out at the CD-ROM attach.
  local isoProblem=""
  if [ -z "${TN_GUEST_ISO:-}" ]; then
    isoProblem="TN_GUEST_ISO is not set"
  elif [ "$TN_GUEST_HOST" = "localhost" ] && [ ! -f "$TN_GUEST_ISO" ]; then
    isoProblem="TN_GUEST_ISO does not exist on this host: $TN_GUEST_ISO"
  fi
  if [ -n "$isoProblem" ]; then
    echo "appliance.sh: $isoProblem. ISOs found under /mnt/$TN_GUEST_POOL:" >&2
    find "/mnt/$TN_GUEST_POOL" -maxdepth 4 -name '*.iso' 2>/dev/null | sed 's/^/  /' >&2 || true
    die "set TN_GUEST_ISO to one of them (a path inside a dataset, not the pool root)"
  fi
  [ -n "${TN_GUEST_HOST_API_KEY:-}${TN_GUEST_HOST_PASSWORD:-}" ] \
    || die "TN_GUEST_HOST_API_KEY or TN_GUEST_HOST_PASSWORD is required"

  # A name the lab can trace back to a run, and a password nobody else knows.
  local nickname="e2e-${GITHUB_RUN_ID:-local-$$}"
  local password
  password=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)

  # Record the nickname before anything else can fail.
  #
  # Between creating an appliance and the caller having somewhere durable to
  # put its name, a crash, a cancellation or a malformed field leaks the
  # appliance — and a leaked appliance starves the next run, which is the
  # failure this whole arrangement exists to prevent. `release` falls back to
  # this file, and tn_guest.py resolves nicknames, so the window is one line
  # wide instead of a whole workflow step. The lifetime is the backstop behind
  # that: an appliance nobody released expires on its own.
  if [ -n "${RUNNER_TEMP:-}" ]; then
    printf '%s\n' "$nickname" > "${RUNNER_TEMP}/${claimedNameFile}"
  fi

  echo "appliance.sh: creating '$nickname' on $TN_GUEST_HOST from $TN_GUEST_ISO" >&2
  local json
  # tn_guest.py logs progress to stderr and prints the deployment JSON last on
  # stdout; the log noise is worth keeping in the job log.
  json=$(tnGuest create \
    --iso "$TN_GUEST_ISO" \
    --admin-pass "$password" \
    --nickname "$nickname" \
    --lifetime "$TN_GUEST_LIFETIME" \
    --memory-mb "$TN_GUEST_MEMORY_MB" \
    --vcpus "$TN_GUEST_VCPUS" \
    --os-disk-gb "$TN_GUEST_OS_DISK_GB" \
    --data-disk-count "$TN_GUEST_DATA_DISK_COUNT" \
    --data-disk-gb "$TN_GUEST_DATA_DISK_GB" \
    --network hostfwd) \
    || die "tn_guest.py create failed for '$nickname'"

  local name adminUser apiHost httpsPort
  name=$(jq -re '.name' <<<"$json")                      || die "create output has no .name"
  adminUser=$(jq -re '.admin_user' <<<"$json")           || die "create output has no .admin_user"
  apiHost=$(jq -re '.nodes[0].api_host' <<<"$json")      || die "create output has no .nodes[0].api_host"
  httpsPort=$(jq -re '.nodes[0].api_port_https' <<<"$json") || die "create output has no .nodes[0].api_port_https"

  # TN_* are the suite's existing contract — see .env.example and
  # e2e/support/config.ts. The host is `host:port` because both the UI (https)
  # and the middleware socket (wss) go through the forwarded 443.
  #
  # TN_DOMAIN is the deployment name, kept under the name the design uses for
  # the thing to release. TN_BASELINE is which baseline it is running against.
  cat <<EOF
TN_PROFILE=shipped
TN_HOST=${apiHost}:${httpsPort}
TN_USERNAME=$adminUser
TN_PASSWORD=$password
TN_DOMAIN=$name
TN_BASELINE=$baseline
EOF
}

# Destroy an appliance. Safe to call twice, and safe to call when claim
# failed — teardown runs unconditionally and must never mask the real failure
# with one of its own.
release() {
  local name="${1:-}"

  # Fall back to what `claim` recorded. The caller usually passes `$TN_DOMAIN`,
  # but that is only set once the workflow has written the claim output into
  # the environment — and the whole point of releasing unconditionally is to
  # cover the paths where that did not happen.
  if [ -z "$name" ] && [ -n "${RUNNER_TEMP:-}" ] && [ -f "${RUNNER_TEMP}/${claimedNameFile}" ]; then
    name=$(cat "${RUNNER_TEMP}/${claimedNameFile}")
    [ -n "$name" ] && echo "appliance.sh: releasing '$name' recorded at claim time" >&2
  fi

  [ -n "$name" ] || { echo "appliance.sh: nothing to release, skipping" >&2; return 0; }

  # A create that failed after recording the nickname cleans up after itself
  # (tn_guest.py tears down partial state unless told not to), so a "not
  # found" here is the normal outcome of that path, not a leak.
  tnGuest delete "$name" || echo "appliance.sh: release of '$name' failed — check the host for a leaked VM" >&2

  [ -n "${RUNNER_TEMP:-}" ] && rm -f "${RUNNER_TEMP}/${claimedNameFile}"
  return 0
}

# Snapshot and revert (E1, E5). Not available: tn_guest.py has no such verbs,
# and a VM behind hostfwd is reinstalled per run. Kept as named entry points so
# the design's references still resolve to the place the work will go.
snapshot() { die "snapshot is not available with tn_guest.py yet (E1, E5)"; }
revert() { die "revert is not available with tn_guest.py yet (E1, E5)"; }

# Collect middleware logs before the appliance is destroyed (R7.2).
#
# Deliberately best-effort: this runs in teardown, frequently after something
# has already gone wrong, and must not turn a test failure into an
# infrastructure failure.
collect_logs() {
  local host="${1:-}" dest="${2:?destination directory required}"
  # No host means the claim never happened — the run failed before it, and the
  # step still runs because it is `if: always()`. Nothing to collect, and a
  # non-zero exit here would paint a second failure over the real one.
  [ -n "$host" ] || { echo "appliance.sh: no host, nothing to collect" >&2; return 0; }
  # A host with a port is a hostfwd guest: only 80 and 443 are forwarded, so
  # there is no SSH to collect over. Middleware logs for these need an API
  # route, which does not exist yet.
  case "$host" in
    *:*) echo "appliance.sh: '$host' is behind hostfwd, no SSH — skipping log collection" >&2; return 0 ;;
  esac
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
