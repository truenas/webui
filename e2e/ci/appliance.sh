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
#                       Optional: unset, `iso` resolves one (below).
#   TN_GUEST_HOST_USER  API user on the host (default: root)
#   TN_GUEST_HOST_API_KEY or TN_GUEST_HOST_PASSWORD — credential for that user
#   TN_GUEST_LIFETIME   VM lifetime, so a leaked one expires (default: 3h)
#
# Guest sizing, all with defaults below. The host is shared with the runner,
# Docker and the browser, so memory and the OS disk are deliberately smaller
# than tn_guest.py's own defaults (8GB, 32GB OS disk):
#
#   TN_GUEST_MEMORY_MB, TN_GUEST_VCPUS, TN_GUEST_OS_DISK_GB,
#   TN_GUEST_DATA_DISK_COUNT, TN_GUEST_DATA_DISK_GB
#
# Nightly resolution (`iso`), when TN_GUEST_ISO is not pinned:
#
#   TN_GUEST_ISO_DIR           where nightlies live on the host
#                              (default: /mnt/<pool>/iso — a child dataset)
#   TN_GUEST_ISO_INDEX         the nightly index to read
#                              (default: https://iso.sys.truenas.net/TrueNAS-27-Nightlies/)
#   TN_GUEST_ISO_SERIES        the build series to follow (default: TrueNAS-27.0.0-MASTER)
#   TN_GUEST_ISO_MAX_AGE_DAYS  how long the chosen nightly is kept before the
#                              next newer one is fetched (default: 7)
#   TN_GUEST_ISO_REFRESH       `1` fetches the newest nightly now, whatever the age
#                              (the workflow also drops the pin for it)
#   TN_GUEST_ISO_KEEP          nightlies of the series left on disk after a
#                              fetch, newest first (default: 2)
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
# Sparse zvols, so the count costs nothing until written. The pool journey
# needs at least nine identical unused disks (see e2e/docs/status.md).
TN_GUEST_DATA_DISK_COUNT="${TN_GUEST_DATA_DISK_COUNT:-10}"
TN_GUEST_DATA_DISK_GB="${TN_GUEST_DATA_DISK_GB:-10}"

TN_GUEST_ISO_DIR="${TN_GUEST_ISO_DIR:-/mnt/$TN_GUEST_POOL/iso}"
TN_GUEST_ISO_INDEX="${TN_GUEST_ISO_INDEX:-https://iso.sys.truenas.net/TrueNAS-27-Nightlies/}"
TN_GUEST_ISO_SERIES="${TN_GUEST_ISO_SERIES:-TrueNAS-27.0.0-MASTER}"
TN_GUEST_ISO_MAX_AGE_DAYS="${TN_GUEST_ISO_MAX_AGE_DAYS:-7}"
TN_GUEST_ISO_KEEP="${TN_GUEST_ISO_KEEP:-2}"

# Which nightly `iso` last chose, kept beside the files. Its mtime is the
# choice's age, which is what the refresh policy reads.
currentNightlyFile=".current-nightly"

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
  command -v openssl > /dev/null || die "openssl is required (it generates the appliance password)"
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
    isoProblem="TN_GUEST_ISO is not set (pin one, or run 'appliance.sh iso' first to resolve a nightly)"
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

  # A name the lab can trace back to a run and attempt, and a password nobody
  # else knows. The attempt matters: a re-run keeps the run id, and a nickname
  # that repeats would collide with anything the previous attempt leaked.
  local nickname="e2e-${GITHUB_RUN_ID:-local-$$}-${GITHUB_RUN_ATTEMPT:-1}"
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

  local name adminUser apiHost httpPort httpsPort
  name=$(jq -re '.name' <<<"$json")                      || die "create output has no .name"
  adminUser=$(jq -re '.admin_user' <<<"$json")           || die "create output has no .admin_user"
  apiHost=$(jq -re '.nodes[0].api_host' <<<"$json")      || die "create output has no .nodes[0].api_host"
  httpPort=$(jq -re '.nodes[0].api_port_http' <<<"$json")   || die "create output has no .nodes[0].api_port_http"
  httpsPort=$(jq -re '.nodes[0].api_port_https' <<<"$json") || die "create output has no .nodes[0].api_port_https"

  # TN_* are the suite's existing contract — see .env.example and
  # e2e/support/config.ts. The host is `host:port` because both the shipped
  # UI (https) and the middleware socket (wss) go through the forwarded 443.
  #
  # TN_HOST_HTTP is the same appliance over the forwarded 80, for the UI the
  # pipeline builds and serves from a container whose nginx proxies to the
  # appliance over plain HTTP. Not part of the suite's contract.
  #
  # TN_DOMAIN is the deployment name, kept under the name the design uses for
  # the thing to release. TN_BASELINE is which baseline it is running against.
  cat <<EOF
TN_PROFILE=shipped
TN_HOST=${apiHost}:${httpsPort}
TN_HOST_HTTP=${apiHost}:${httpPort}
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

# ─── Nightly resolution ──────────────────────────────────────────────────────
#
# Which ISO to install from, without anybody naming a file.
#
# A pinned TN_GUEST_ISO is honoured as it always was. Otherwise the newest
# nightly of the series is kept on the host and reused until it is
# TN_GUEST_ISO_MAX_AGE_DAYS old, then the newest one is fetched. A week is the
# cadence the appliance template is meant to be rebuilt on; between rebuilds
# every run installs the same build, so a failure that appears mid-week is a
# UI change and not a moving appliance. A run that needs a middleware change
# merged this morning asks for it with TN_GUEST_ISO_REFRESH=1 (the
# `refresh_iso` input of the workflow) rather than waiting the week out.
#
# The index is a plain listing with cursor pagination and no useful order
# across pages, so every page is read and the newest name wins: the series
# names embed `+YYYYMMDD-HHMMSS`, which sorts as text. A `.iso.sha256` beside
# the file is used when the index has one. The file is written world-readable
# into the directory as a whole file, never a partial one: middleware refuses
# an ISO that libvirt cannot read, and a run must never install from a
# download that stopped halfway.
#
# Emits `TN_GUEST_ISO=<path>` on stdout for `>> "$GITHUB_ENV"`, plus
# `TN_GUEST_ISO_SOURCE=pinned|reused|downloaded` so the log says which.
# ─────────────────────────────────────────────────────────────────────────────

# Every ISO name the index lists, one per line, across all of its pages.
listIndex() {
  local cursor="" previous="" page next
  local i
  for i in $(seq 1 100); do
    page=$(curl -fsSL --retry 3 --retry-delay 5 "${TN_GUEST_ISO_INDEX}${cursor}") \
      || die "could not read the nightly index at ${TN_GUEST_ISO_INDEX}${cursor}"
    grep -oiE 'href="[^"]*\.iso\?download=1"' <<<"$page" \
      | sed -E 's/^href="//; s/\?download=1"$//; s|^.*/||; s/&#43;/+/g; s/%2[bB]/+/g' || true
    next=$(grep -oE 'href="[^"]*[?&]cursor=[^"&]*' <<<"$page" | head -1 | sed -E 's/.*cursor=//' || true)
    [ -n "$next" ] && [ "$next" != "$previous" ] || return 0
    previous="$next"
    cursor="?cursor=$next"
  done
  die "the nightly index did not end after $i pages; refusing to loop forever"
}

# The newest nightly of the series the index offers.
newestNightly() {
  local pattern="^${TN_GUEST_ISO_SERIES//./\\.}\\+[0-9]{8}-[0-9]{6}\\.iso$"
  listIndex | grep -E "$pattern" | sort | tail -1
}

# The URL a listed name downloads from. Only `+` needs encoding in these names.
downloadUrl() {
  local name="$1"
  printf '%s%s?download=1' "$TN_GUEST_ISO_INDEX" "${name//+/%2B}"
}

# Fetch one nightly into TN_GUEST_ISO_DIR, verified when a checksum is published.
fetchNightly() {
  local name="$1"
  local target="$TN_GUEST_ISO_DIR/$name" partial="$TN_GUEST_ISO_DIR/$name.part"

  echo "appliance.sh: downloading $name to $TN_GUEST_ISO_DIR" >&2
  # Resumable, so a network blip mid-way through 2.7GB costs the remainder,
  # not the whole file. Silent: the progress meter is thousands of lines in a
  # CI log, and errors still print.
  curl -fsSL --retry 3 --retry-delay 10 -C - -o "$partial" "$(downloadUrl "$name")" \
    || die "download of $name failed"

  local published
  if published=$(curl -fsSL --retry 2 "$(downloadUrl "$name.sha256")" 2>/dev/null | awk 'NR==1 {print $1}') \
    && [ -n "$published" ]; then
    local actual
    actual=$(sha256sum "$partial" | awk '{print $1}')
    [ "$actual" = "$published" ] \
      || { rm -f "$partial"; die "checksum mismatch for $name: index says $published, file is $actual"; }
    echo "appliance.sh: checksum verified" >&2
  else
    echo "appliance.sh: no checksum published for $name; installing it unverified" >&2
  fi

  chmod 0644 "$partial"
  mv "$partial" "$target"
}

# Drop nightlies of the series beyond the newest TN_GUEST_ISO_KEEP. Only files
# this resolver would have fetched match the pattern; anything else in the
# directory is somebody's and is left alone.
pruneNightlies() {
  local pattern="^${TN_GUEST_ISO_SERIES//./\\.}\\+[0-9]{8}-[0-9]{6}\\.iso$"
  local stale
  stale=$(ls -1 "$TN_GUEST_ISO_DIR" 2>/dev/null | grep -E "$pattern" | sort -r | tail -n "+$((TN_GUEST_ISO_KEEP + 1))" || true)
  local name
  for name in $stale; do
    echo "appliance.sh: pruning $name" >&2
    rm -f "$TN_GUEST_ISO_DIR/$name"
  done
}

# Age of the current choice in whole days, or a large number when there is none.
currentNightlyAgeDays() {
  local pointer="$TN_GUEST_ISO_DIR/$currentNightlyFile"
  [ -f "$pointer" ] || { echo 999999; return; }
  local now modified
  now=$(date +%s)
  modified=$(stat -c %Y "$pointer" 2>/dev/null || stat -f %m "$pointer")
  echo $(( (now - modified) / 86400 ))
}

iso() {
  if [ -n "${TN_GUEST_ISO:-}" ]; then
    echo "appliance.sh: using pinned ISO $TN_GUEST_ISO" >&2
    printf 'TN_GUEST_ISO=%s\nTN_GUEST_ISO_SOURCE=pinned\n' "$TN_GUEST_ISO"
    return
  fi

  command -v curl > /dev/null || die "curl is required to resolve a nightly"
  command -v sha256sum > /dev/null || die "sha256sum is required to verify a nightly"
  [ -d "$TN_GUEST_ISO_DIR" ] \
    || die "TN_GUEST_ISO_DIR does not exist: $TN_GUEST_ISO_DIR (it has to be a child dataset the runner can write)"
  [ -w "$TN_GUEST_ISO_DIR" ] \
    || die "TN_GUEST_ISO_DIR is not writable by $(id -un): $TN_GUEST_ISO_DIR"

  local pointer="$TN_GUEST_ISO_DIR/$currentNightlyFile"
  local current="" age
  [ -f "$pointer" ] && current=$(cat "$pointer")
  age=$(currentNightlyAgeDays)

  if [ "${TN_GUEST_ISO_REFRESH:-}" != "1" ] && [ -n "$current" ] && [ -f "$TN_GUEST_ISO_DIR/$current" ] \
    && [ "$age" -lt "$TN_GUEST_ISO_MAX_AGE_DAYS" ]; then
    echo "appliance.sh: reusing $current, chosen $age day(s) ago (refreshes at $TN_GUEST_ISO_MAX_AGE_DAYS)" >&2
    printf 'TN_GUEST_ISO=%s\nTN_GUEST_ISO_SOURCE=reused\n' "$TN_GUEST_ISO_DIR/$current"
    return
  fi

  local newest
  newest=$(newestNightly)
  [ -n "$newest" ] || die "the index at $TN_GUEST_ISO_INDEX lists no $TN_GUEST_ISO_SERIES nightly"
  echo "appliance.sh: newest nightly is $newest" >&2

  local source="downloaded"
  if [ -f "$TN_GUEST_ISO_DIR/$newest" ]; then
    echo "appliance.sh: already on disk" >&2
    source="reused"
  else
    fetchNightly "$newest"
  fi

  # The choice is recorded after the file is whole, and its clock starts now:
  # a refresh that finds the same file still resets the week.
  printf '%s\n' "$newest" > "$pointer"
  touch "$pointer"
  pruneNightlies

  printf 'TN_GUEST_ISO=%s\nTN_GUEST_ISO_SOURCE=%s\n' "$TN_GUEST_ISO_DIR/$newest" "$source"
}

# Snapshot and revert (E1, E5). Not available: tn_guest.py has no such verbs,
# and a VM behind hostfwd is reinstalled per run. Kept as named entry points so
# the design's references still resolve to the place the work will go.
snapshot() { die "snapshot is not available with tn_guest.py yet (E1, E5)"; }
revert() { die "revert is not available with tn_guest.py yet (E1, E5)"; }

# Middleware log collection (R7.2) has no implementation here. The appliance
# is behind hostfwd with only 80 and 443 forwarded, so there is no SSH path;
# it needs an API route. Not stubbed, so nothing reports green while doing
# nothing.

case "${1:-}" in
  iso)          shift; iso "$@" ;;
  claim)        shift; claim "$@" ;;
  release)      shift; release "$@" ;;
  snapshot)     shift; snapshot "$@" ;;
  revert)       shift; revert "$@" ;;
  *) die "usage: appliance.sh {iso|claim|release|snapshot|revert} [args]" ;;
esac
