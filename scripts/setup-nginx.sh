#!/bin/bash
set -e

DOMAIN=${1:-}
EMAIL=${2:-}

# ─── Install nginx ────────────────────────────────────────────────────────────
if ! command -v nginx &> /dev/null; then
  echo "Installing nginx..."
  apt-get update -y
  apt-get install -y nginx
  systemctl enable nginx
else
  echo "Nginx already installed, skipping."
fi

rm -f /etc/nginx/sites-enabled/default

# ─── No domain: HTTP-only config ─────────────────────────────────────────────
if [ -z "$DOMAIN" ]; then
  echo "No domain configured. Applying HTTP-only nginx config..."
  cp /tmp/nginx-prod.conf /etc/nginx/sites-available/portfolio
  ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
  nginx -t && systemctl reload nginx
  echo "Nginx running in HTTP-only mode."
  exit 0
fi

# ─── Domain provided: install certbot + SSL ───────────────────────────────────
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  apt-get install -y certbot python3-certbot-nginx
else
  echo "Certbot already installed, skipping."
fi

CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

# First run: bootstrap HTTP config to pass ACME challenge
if [ ! -d "$CERT_DIR" ]; then
  echo "No SSL cert found. Bootstrapping HTTP config to obtain cert..."
  cp /tmp/nginx-prod.conf "$NGINX_CONF"
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  mkdir -p /var/www/certbot
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" \
    --non-interactive --agree-tos -m "$EMAIL"
  echo "SSL cert obtained."
fi

# Apply full HTTPS config
echo "Applying HTTPS nginx config for $DOMAIN..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" /tmp/nginx-prod-ssl.conf > "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "Nginx running with HTTPS for $DOMAIN."

# Auto-renewal cron (once)
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
  echo "Certbot auto-renewal cron added."
fi
