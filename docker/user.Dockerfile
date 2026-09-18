FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# Copy root workspace configs
COPY package.json bun.lock* tsconfig.base.json ./
COPY packages/ ./packages/
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install dependencies and build Vite app with relative API base
RUN bun install
WORKDIR /app/frontend/user
ENV VITE_API_BASE=/api
RUN bun run build

FROM nginx:alpine AS runner
COPY --from=build /app/frontend/user/dist /usr/share/nginx/html
COPY docker/user.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
