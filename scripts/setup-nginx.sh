#!/bin/bash
set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: setup-nginx.sh <domain> <email>"
  exit 1
fi

NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# ─── Nginx ────────────────────────────────────────────────────────────────────
if ! command -v nginx &> /dev/null; then
  echo "Installing nginx..."
  apt-get update -y
  apt-get install -y nginx
  systemctl enable nginx
else
  echo "Nginx already installed, skipping."
fi

# ─── Certbot ──────────────────────────────────────────────────────────────────
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  apt-get install -y certbot python3-certbot-nginx
else
  echo "Certbot already installed, skipping."
fi

# ─── Remove default config ────────────────────────────────────────────────────
rm -f /etc/nginx/sites-enabled/default

# ─── First run: get SSL cert via HTTP challenge ───────────────────────────────
if [ ! -d "$CERT_DIR" ]; then
  echo "No SSL cert found. Bootstrapping HTTP config to obtain cert..."

  cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Configuring SSL, please wait...';
        add_header Content-Type text/plain;
    }
}
EOF

  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  mkdir -p /var/www/certbot
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" \
    --non-interactive --agree-tos -m "$EMAIL"

  echo "SSL cert obtained successfully."
fi

# ─── Apply full config ────────────────────────────────────────────────────────
echo "Applying nginx config for $DOMAIN..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" /tmp/nginx-prod.conf > "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "Nginx configured and reloaded."

# ─── Auto-renewal cron (once) ─────────────────────────────────────────────────
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
  echo "Certbot auto-renewal cron added."
fi
