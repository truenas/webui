#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

package_name="harbornavi-assistant-webui"
version="${HARBORNAVI_WEBUI_VERSION:-$(date +%Y%m%d)}"
artifact_root="${HARBORNAVI_WEBUI_ARTIFACT_ROOT:-$repo_root/dist/harbornavi-k3-package}"
dist_dir="${HARBORNAVI_WEBUI_DIST_DIR:-$repo_root/dist}"
package_root="$artifact_root/${package_name}_${version}_all"
deb_path="$artifact_root/${package_name}_${version}_all.deb"

if [[ "${HARBORNAVI_WEBUI_SKIP_BUILD:-0}" != "1" ]]; then
  yarn build:harbornavi-k3
fi

rm -f "$dist_dir/sw.js"

rm -rf "$package_root"
mkdir -p \
  "$package_root/DEBIAN" \
  "$package_root/etc/nginx/conf.d" \
  "$package_root/usr/share/harbornavi/webui"
chmod 0755 "$package_root" "$package_root/DEBIAN"

cp -a "$dist_dir/." "$package_root/usr/share/harbornavi/webui/"

cat > "$package_root/DEBIAN/control" <<CONTROL
Package: $package_name
Version: $version
Section: web
Priority: optional
Architecture: all
Maintainer: Harbor Innovations <dev@harbor.local>
Depends: nginx, ca-certificates
Description: HarborNavi K3 Harbor Assistant WebUI
 Static Harbor Assistant WebUI build for HarborNavi on K3/Bianbu.
CONTROL

cat > "$package_root/etc/nginx/conf.d/harbornavi-webui.conf" <<'NGINX'
server {
    listen 80;
    server_name 192.168.3.21 127.0.0.1 localhost;
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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/beacon/ {
        proxy_pass http://127.0.0.1:4174;
        proxy_http_version 1.1;
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
dpkg-deb --build "$package_root" "$deb_path"
sha256sum "$deb_path" > "$deb_path.sha256"

echo "$deb_path"
