FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# Copy root workspace configs
COPY package.json bun.lock* tsconfig.base.json ./
COPY packages/ ./packages/
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install dependencies and generate static Nuxt SPA
RUN bun install
WORKDIR /app/frontend/admin
ENV NUXT_PUBLIC_API_BASE=/api
RUN bun run generate

FROM nginx:alpine AS runner
COPY --from=build /app/frontend/admin/.output/public /usr/share/nginx/html
COPY docker/admin.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
