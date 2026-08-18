#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Installing coffee-peek dependencies"
cd "$ROOT/coffee-peek"
npm ci

echo "==> Installing coffee-peek-admin dependencies"
cd "$ROOT/coffee-peek-admin"
npm ci

# The admin app's .env is gitignored; seed a local one pointing at the shared
# public API so the app can run end-to-end. Only created when missing.
if [ ! -f "$ROOT/coffee-peek-admin/.env" ]; then
  echo "==> Seeding coffee-peek-admin/.env from .env.example"
  cp "$ROOT/coffee-peek-admin/.env.example" "$ROOT/coffee-peek-admin/.env"
  sed -i 's#^VITE_API_URL=.*#VITE_API_URL=https://api.coffeepeek.by#' "$ROOT/coffee-peek-admin/.env"
fi

echo "==> install.sh complete"
