#!/bin/sh
set -e
cd /app
npx prisma migrate deploy
npx prisma db seed
exec node dist/main.js
