#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

package_name="harbornavi-assistant-webui"
release_versions_file="$repo_root/scripts/harbornavi-k3/media-stack-release.env"
if [[ ! -f "$release_versions_file" ]]; then
  echo "error: missing media stack release versions: $release_versions_file" >&2
  exit 2
fi
# shellcheck source=media-stack-release.env
source "$release_versions_file"

build_timestamp="$(date -u +%Y%m%d%H%M%S)"
source_revision="$(git rev-parse --short=12 HEAD 2>/dev/null || printf 'nogit')"
version="${HARBORNAVI_WEBUI_VERSION:-1.2.0+build${build_timestamp}.${source_revision}}"
beacon_min_version="0.1.0"
harborlink_min_version="0.1.0"
artifact_root="${HARBORNAVI_WEBUI_ARTIFACT_ROOT:-$repo_root/dist/harbornavi-k3-package}"
dist_dir="${HARBORNAVI_WEBUI_DIST_DIR:-$repo_root/dist}"
package_work_parent="${HARBORNAVI_WEBUI_PACKAGE_WORK_ROOT:-${TMPDIR:-/tmp}}"
if [[ "$package_work_parent" =~ ^/mnt/[[:alpha:]](/|$) ]]; then
  echo "warning: HARBORNAVI_WEBUI_PACKAGE_WORK_ROOT is on a Windows mount; using /tmp for dpkg work files" >&2
  package_work_parent="/tmp"
fi
mkdir -p "$package_work_parent"
if [[ "$artifact_root" != "$dist_dir" && "$artifact_root" == "$dist_dir"/* ]]; then
  rm -rf "$artifact_root"
fi
package_work_root="$(mktemp -d "${package_work_parent%/}/harbornavi-webui-package.XXXXXX")"
package_root="$package_work_root/${package_name}_${version}_all"
deb_path="$artifact_root/${package_name}_${version}_all.deb"

for release_value in \
  "$version" \
  "$HARBORNAVI_BEACON_RELEASE_VERSION" \
  "$HARBORLINK_RELEASE_VERSION"; do
  if [[ ! "$release_value" =~ ^[0-9A-Za-z.+:~_-]+$ ]]; then
    echo "error: unsafe Debian release version: $release_value" >&2
    exit 2
  fi
done

if [[ ! "$HARBORNAVI_MEDIA_RELEASE_ID" =~ ^[0-9A-Za-z._-]+$ ]]; then
  echo "error: unsafe media release id: $HARBORNAVI_MEDIA_RELEASE_ID" >&2
  exit 2
fi

cleanup_package_work_root() {
  rm -rf "$package_work_root"
}

trap cleanup_package_work_root EXIT

if [[ "${HARBORNAVI_WEBUI_SKIP_BUILD:-0}" != "1" ]]; then
  yarn build:harbornavi-k3
fi

mkdir -p \
  "$package_root/DEBIAN" \
  "$package_root/etc/nginx/conf.d" \
  "$package_root/usr/share/harbornavi/webui" \
  "$package_root/usr/share/doc/$package_name"
chmod 0755 "$package_root" "$package_root/DEBIAN"

cp -a "$dist_dir/." "$package_root/usr/share/harbornavi/webui/"
find "$package_root/usr/share/harbornavi/webui" -type d -exec chmod 0755 {} +
find "$package_root/usr/share/harbornavi/webui" -type f -exec chmod 0644 {} +

cat > "$package_root/DEBIAN/control" <<CONTROL
Package: $package_name
Version: $version
Section: web
Priority: optional
Architecture: all
Maintainer: Harbor Innovations <dev@harbor.local>
Depends: nginx, ca-certificates, harboros-beacon (>= $beacon_min_version), harborlink (>= $harborlink_min_version)
Description: HarborNavi K3 Harbor Assistant WebUI
 Static Harbor Assistant WebUI build for HarborNavi on K3/Bianbu.
CONTROL
chmod 0644 "$package_root/DEBIAN/control"

cat > "$package_root/usr/share/doc/$package_name/release-manifest.json" <<MANIFEST
{
  "schema_version": 1,
  "release_id": "$HARBORNAVI_MEDIA_RELEASE_ID",
  "generated_at_utc": "$build_timestamp",
  "packages": {
    "webui": {
      "name": "$package_name",
      "version": "$version"
    },
    "harbor_beacon": {
      "name": "harboros-beacon",
      "version": "$HARBORNAVI_BEACON_RELEASE_VERSION",
      "minimum_compatible_version": "$beacon_min_version"
    },
    "harbor_link": {
      "name": "harborlink",
      "version": "$HARBORLINK_RELEASE_VERSION",
      "minimum_compatible_version": "$harborlink_min_version"
    }
  },
  "contracts": {
    "browser_media_origin": "same-origin",
    "harbor_link_media_path": "/api/harbor-link/media/",
    "middleware_network_policy_owner": "middleware"
  },
  "deployment_order": ["harborlink", "harboros-beacon", "$package_name"],
  "rollback_order": ["$package_name", "harboros-beacon", "harborlink"]
}
MANIFEST
chmod 0644 "$package_root/usr/share/doc/$package_name/release-manifest.json"

cat > "$package_root/etc/nginx/conf.d/harbornavi-webui.conf" <<'NGINX'
server {
    listen 80;
    server_name 192.168.6.219 192.168.3.21 192.168.3.70 127.0.0.1 localhost;
    server_tokens off;

    client_max_body_size 50m;

    allow 127.0.0.1;
    allow 192.168.0.0/16;
    deny all;

    location = / {
        return 302 /ui/harbor-assistant;
    }

    location /ui/ {
        alias /usr/share/harbornavi/webui/;
        try_files $uri $uri/ /ui/index.html;
        add_header Cache-Control "must-revalidate";
    }

    location = /api/beacon {
        proxy_pass http://127.0.0.1:4174;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /api/harbor-beacon {
        proxy_pass http://127.0.0.1:4174;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /api/harbor-link/media/ {
        proxy_pass http://127.0.0.1:8889/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect ~^/(.+)$ /api/harbor-link/media/$1;
    }

    location ^~ /api/harbor-link/hls/ {
        proxy_pass http://127.0.0.1:8888/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect ~^/(.+)$ /api/harbor-link/hls/$1;
    }

    location /api/beacon/ {
        proxy_pass http://127.0.0.1:4174;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/harbor-beacon/ {
        proxy_pass http://127.0.0.1:4174;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /api/harbor-gate {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/harbor-gate/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
chmod 0644 "$package_root/etc/nginx/conf.d/harbornavi-webui.conf"

cat > "$package_root/DEBIAN/postinst" <<'POSTINST'
#!/usr/bin/env bash
set -euo pipefail

if command -v nginx >/dev/null 2>&1; then
  nginx -t
  systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
fi
POSTINST
chmod 0755 "$package_root/DEBIAN/postinst"

find "$package_root" -type d -exec chmod a-s,u=rwx,go=rx {} +
mkdir -p "$artifact_root"
dpkg-deb --build "$package_root" "$deb_path"
cp \
  "$package_root/usr/share/doc/$package_name/release-manifest.json" \
  "$deb_path.release-manifest.json"
sha256sum "$deb_path" > "$deb_path.sha256"

echo "$deb_path"
