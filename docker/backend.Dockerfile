FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Copy root workspace and package manifests
COPY package.json bun.lock* tsconfig.base.json ./
COPY packages/ ./packages/
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install dependencies
RUN bun install

WORKDIR /app/backend

EXPOSE 3001

CMD ["sh", "-c", "bun run db:push && bun run src/index.ts"]
