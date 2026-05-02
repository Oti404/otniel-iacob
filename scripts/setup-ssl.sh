#!/bin/bash
# Run once after first deploy to enable HTTPS.
# Usage: sudo ./setup-ssl.sh yourdomain.com your@email.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>"
  exit 1
fi

echo "Configuring domain: $DOMAIN"

# Replace placeholder in nginx config
sudo sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/portfolio
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --redirect

echo ""
echo "HTTPS is now active for $DOMAIN"
echo "Add DOMAIN=$DOMAIN to your .env on the server and redeploy."
