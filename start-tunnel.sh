#!/bin/bash
# Starts a Cloudflare Tunnel for the API so anyone on the internet can reach it.
# Usage: ./start-tunnel.sh

API_PORT=${PORT:-3000}

echo "Starting Cloudflare Tunnel for localhost:$API_PORT ..."
echo ""

cloudflared tunnel --url http://localhost:$API_PORT 2>&1 | while read -r line; do
  # Cloudflared prints the public URL to stderr in a line like:
  #   |  https://xxxx-xxxx-xxxx.trycloudflare.com
  url=$(echo "$line" | grep -oE 'https://[a-zA-Z0-9._-]+\.trycloudflare\.com')
  if [ -n "$url" ]; then
    echo "============================================"
    echo "  Tunnel is live!"
    echo "  Public API URL: ${url}/api"
    echo ""
    echo "  Update your mobile .env:"
    echo "  EXPO_PUBLIC_API_URL=${url}/api"
    echo ""
    echo "  Then restart Expo:"
    echo "  npx expo start --tunnel"
    echo "============================================"
  fi
  echo "$line"
done
