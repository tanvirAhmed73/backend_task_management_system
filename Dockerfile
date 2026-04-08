# Build and run the NestJS API with Prisma (migrations + seed on startup).
FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

RUN npx prisma generate && npx nest build

ENTRYPOINT ["./docker/entrypoint.sh"]
