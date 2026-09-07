FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# Copy root workspace configs
COPY package.json bun.lock tsconfig.base.json ./
# Bun validates the root lockfile against every declared workspace.
# Copy the complete workspace tree so frozen installs are reproducible.
COPY packages/ ./packages/
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install dependencies and generate the static Nuxt SPA for Nginx
RUN bun install --frozen-lockfile
WORKDIR /app/frontend/admin
RUN bun run generate

FROM nginx:alpine AS runner
COPY --from=build /app/frontend/admin/.output/public /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

