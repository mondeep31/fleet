# Production deploy URLs

Deploy URLs follow:

```text
https://depl-fleet-{projectId}.mondeep.xyz
```

The Fleet dashboard stays on a separate host (e.g. `https://fleet.mondeep.xyz`). Traefik routes deploy traffic by `Host` header on `127.0.0.1:18080`.

## 1. Environment

In `app_env/.env` on the server:

```bash
FLEET_APPS_DOMAIN=mondeep.xyz
FLEET_PUBLIC_URL_SCHEME=https
FLEET_TRAEFIK_PUBLIC_PORT=
```

Redeploy Fleet after changing env so the dashboard rebuild picks up any related config.

## 2. DNS

| Type | Name  | Value        |
|------|-------|--------------|
| A    | `*`   | server IP    |
| A    | `fleet` | server IP  |

Wildcard `*` covers all `depl-fleet-{projectId}.mondeep.xyz` hosts. `fleet` is the dashboard.

## 3. Wildcard TLS (certbot + Cloudflare DNS)

Install the DNS plugin:

```bash
sudo apt install certbot python3-certbot-dns-cloudflare
```

Create `/etc/letsencrypt/cloudflare.ini`:

```ini
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
```

```bash
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d mondeep.xyz \
  -d '*.mondeep.xyz'
```

Cert path: `/etc/letsencrypt/live/mondeep.xyz/fullchain.pem`

## 4. nginx

Dashboard block (`fleet.mondeep.xyz` → Next.js `:3000`) — keep your existing config, but point SSL at the wildcard cert above.

Deploy block (Traefik):

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ~^depl-fleet-.+\.mondeep\.xyz$;

    ssl_certificate     /etc/letsencrypt/live/mondeep.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mondeep.xyz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:18080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTP → HTTPS redirect for deploy hosts:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ~^depl-fleet-.+\.mondeep\.xyz$;
    return 301 https://$host$request_uri;
}
```

Reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Redeploy projects

Traefik `Host(...)` labels are applied when containers start. After env + nginx are in place:

1. Open each project in the Fleet dashboard.
2. Trigger a new deploy (or stop + redeploy).

Stored `deployment.url` and Traefik routing will use `https://depl-fleet-{projectId}.mondeep.xyz`.

Legacy name-based subdomains are auto-migrated to `depl-fleet-{projectId}` on the next deploy.

## 6. Verify

On the server:

```bash
# Traefik responds for deploy host
curl -sI -H "Host: depl-fleet-YOUR-PROJECT-ID.mondeep.xyz" http://127.0.0.1:18080

# Public HTTPS (after deploy is live)
curl -I https://depl-fleet-YOUR-PROJECT-ID.mondeep.xyz

# Fleet services
pm2 status
docker compose ps
```

In the dashboard, the deployment row should show the HTTPS URL and it should open in a browser.
