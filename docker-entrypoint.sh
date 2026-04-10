#!/bin/sh
set -e
cd /app

if [ ! -d "node_modules/next" ]; then
  echo "[docker] Installing dependencies..."
  npm install
fi

echo "[docker] Prisma generate & migrate..."
npx prisma generate
npx prisma migrate deploy

echo "[docker] Starting Next.js on 0.0.0.0:3000..."
exec npx next dev -H 0.0.0.0 -p 3000
