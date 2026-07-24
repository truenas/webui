#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
build_script="$repo_root/scripts/harbornavi-k3/build-deb.sh"
release_versions_file="$repo_root/scripts/harbornavi-k3/media-stack-release.env"
# shellcheck source=media-stack-release.env
source "$release_versions_file"

work_root="$(mktemp -d "${TMPDIR:-/tmp}/harbornavi-webui-contract.XXXXXX")"
dist_root="$work_root/dist"
artifact_root="$work_root/artifacts"
package_work_root="$work_root/package-work"
previous_version="1.2.0+build20260722000001.contract"
current_version="1.2.0+build20260722000002.contract"

cleanup() {
  rm -rf "$work_root"
}
trap cleanup EXIT

mkdir -p "$dist_root" "$artifact_root" "$package_work_root"
printf '<!doctype html><title>package contract</title>\n' > "$dist_root/index.html"

build_version() {
  local version="$1"
  HARBORNAVI_WEBUI_SKIP_BUILD=1 \
  HARBORNAVI_WEBUI_VERSION="$version" \
  HARBORNAVI_WEBUI_DIST_DIR="$dist_root" \
  HARBORNAVI_WEBUI_ARTIFACT_ROOT="$artifact_root" \
  HARBORNAVI_WEBUI_PACKAGE_WORK_ROOT="$package_work_root" \
    "$build_script" >/dev/null
}

build_version "$previous_version"
build_version "$current_version"

previous_deb="$artifact_root/harbornavi-assistant-webui_${previous_version}_all.deb"
current_deb="$artifact_root/harbornavi-assistant-webui_${current_version}_all.deb"
current_manifest="$current_deb.release-manifest.json"

[[ -f "$previous_deb" ]]
[[ -f "$current_deb" ]]
[[ -f "$current_manifest" ]]
dpkg --compare-versions "$previous_version" lt "$current_version"
dpkg --compare-versions "$current_version" gt "$previous_version"

[[ "$(dpkg-deb --field "$current_deb" Package)" == "harbornavi-assistant-webui" ]]
[[ "$(dpkg-deb --field "$current_deb" Version)" == "$current_version" ]]
[[ "$(dpkg-deb --field "$current_deb" Architecture)" == "all" ]]
depends="$(dpkg-deb --field "$current_deb" Depends)"
[[ "$depends" == *"harboros-beacon (>= 0.1.0)"* ]]
[[ "$depends" == *"harborlink (>= 0.1.0)"* ]]
sha256sum --check "$current_deb.sha256"

extract_root="$work_root/extracted"
dpkg-deb --extract "$current_deb" "$extract_root"
installed_manifest="$extract_root/usr/share/doc/harbornavi-assistant-webui/release-manifest.json"
cmp "$current_manifest" "$installed_manifest"
nginx_config="$extract_root/etc/nginx/conf.d/harbornavi-webui.conf"
grep -Fq 'location = /api/harbor-beacon {' "$nginx_config"
grep -Fq 'location /api/harbor-beacon/ {' "$nginx_config"

python3 - \
  "$current_manifest" \
  "$current_version" \
  "$HARBORNAVI_MEDIA_RELEASE_ID" \
  "$HARBORNAVI_BEACON_RELEASE_VERSION" \
  "$HARBORLINK_RELEASE_VERSION" <<'PYTHON'
import json
import sys

manifest_path, webui_version, release_id, beacon_version, harborlink_version = sys.argv[1:]
with open(manifest_path, encoding="utf-8") as manifest_file:
    manifest = json.load(manifest_file)

if not (
    manifest["release_id"] == release_id
    and manifest["packages"]["webui"]["version"] == webui_version
    and manifest["packages"]["harbor_beacon"]["version"] == beacon_version
    and manifest["packages"]["harbor_link"]["version"] == harborlink_version
):
    raise RuntimeError("Release manifest package versions do not match the release contract.")
PYTHON

echo "HarborNavi WebUI package upgrade/rollback contract checks passed."
