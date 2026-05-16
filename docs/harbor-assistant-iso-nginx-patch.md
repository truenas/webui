# Harbor Assistant ISO nginx Service Entries

Harbor Assistant WebUI now uses the HarborOS service-level API entries that are
already present in the ISO template:

```text
/api/harbor-beacon/* -> harboros-beacon.service on 127.0.0.1:4174
/api/harbor-gate/*   -> harboros-im-gate.service on 127.0.0.1:8787
```

Do not add a product-level Harbor Assistant nginx location for this WebUI
slice. HarborBeacon and HarborGate both accept their service-level prefixes,
so nginx can preserve the incoming URI:

```nginx
        location = /api/harbor-beacon {
            proxy_pass http://127.0.0.1:4174;
            proxy_http_version 1.1;
            proxy_set_header X-Real-Remote-Addr $remote_addr;
            proxy_set_header X-Real-Remote-Port $remote_port;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        location /api/harbor-beacon/ {
            proxy_pass http://127.0.0.1:4174;
            proxy_http_version 1.1;
            proxy_set_header X-Real-Remote-Addr $remote_addr;
            proxy_set_header X-Real-Remote-Port $remote_port;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        location = /api/harbor-gate {
            proxy_pass http://127.0.0.1:8787;
            proxy_http_version 1.1;
            proxy_set_header X-Real-Remote-Addr $remote_addr;
            proxy_set_header X-Real-Remote-Port $remote_port;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        location /api/harbor-gate/ {
            proxy_pass http://127.0.0.1:8787;
            proxy_http_version 1.1;
            proxy_set_header X-Real-Remote-Addr $remote_addr;
            proxy_set_header X-Real-Remote-Port $remote_port;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }
```

Runtime smoke after ISO install:

```bash
curl http://<vm-ip>/api/harbor-beacon/state
curl http://<vm-ip>/api/harbor-beacon/home-assistant/status
curl http://<vm-ip>/api/harbor-gate/setup/weixin
curl http://<vm-ip>/api/harbor-gate/api/setup/weixin/login/status
```
