# Backend - Task Management System

Minimal setup to run the backend locally or with Docker.

## Prerequisites

- Node.js 22+
- npm
- Docker (optional, if using Compose)

## Environment

Create/update `.env` in the project root.

Required seed values:

```env
SEED_ADMIN_EMAIL=admin@local.dev
SEED_ADMIN_PASSWORD=ChangeMeAdmin123!
SEED_USER_EMAIL=user@local.dev
SEED_USER_PASSWORD=ChangeMeUser123!
```

## Run locally

```bash
npm install
npm run prisma:migrate
npm run prisma:generate
npx prisma db seed
npm run start:dev
```

API runs on `http://localhost:4000` (Swagger: `/api/docs` in development).

## Run with Docker

```bash
docker compose up
```

On the first run (or after changing the Dockerfile), use `docker compose up --build`.

This starts:
- API (port `4000`)
- PostgreSQL
- Redis
