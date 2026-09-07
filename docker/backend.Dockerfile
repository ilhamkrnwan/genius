FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Copy root workspace and package manifests
COPY package.json bun.lock tsconfig.base.json ./
# Bun validates the root lockfile against every declared workspace.
# Copy the complete workspace tree so frozen installs are reproducible.
COPY packages/ ./packages/
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install dependencies
RUN bun install --frozen-lockfile

WORKDIR /app/backend

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
