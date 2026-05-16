# Harbor Assistant ISO nginx Patch

The HarborOS ISO middlewared repository was not present in this local checkout.
Apply the following change to the source file that installs as:

```text
/usr/lib/python3/dist-packages/middlewared/etc_files/local/nginx/nginx.conf.mako
```

The goal is to keep the browser-facing Harbor Assistant API clean:

```text
/api/harbor-assistant/* -> HarborGate facade -> Beacon-owned APIs
```

Patch the template near the existing `featured-photos-api`,
`api/harbor-beacon`, and `api/harbor-gate` locations:

```nginx
        location = /api/harbor-assistant {
            proxy_pass http://127.0.0.1:8787/api/harbor-assistant;
            proxy_http_version 1.1;
            proxy_set_header X-Real-Remote-Addr $remote_addr;
            proxy_set_header X-Real-Remote-Port $remote_port;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        location /api/harbor-assistant/ {
            proxy_pass http://127.0.0.1:8787/api/harbor-assistant/;
            proxy_http_version 1.1;
            proxy_set_header X-Real-Remote-Addr $remote_addr;
            proxy_set_header X-Real-Remote-Port $remote_port;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
        }
```

Keep the existing `/api/harbor-beacon` and `/api/harbor-gate` service-level
locations as diagnostic/service entries.
