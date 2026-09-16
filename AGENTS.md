# UNU Genius 2026 — Monorepo Rules & Stack

## Monorepo Architecture (Bun Workspaces)

### 1. `frontend/user` (`@genius-unu/user`)
* **Purpose:** Aplikasi eksplorasi gamifikasi interaktif untuk Mahasiswa Baru PKKMB UNU Yogyakarta 2026.
* **Tech Stack:** Vue 3 (Composition API `<script setup lang="ts">`), Vite 6 + `@tailwindcss/vite`, Vue Router 4, Pinia, `@phosphor-icons/vue`, Lucide Icons, Tailwind CSS v4 + Stardew Valley Retro RPG Theme.
* **Port:** `http://localhost:3000` (Production Docker: `4000`)

### 2. `frontend/admin` (`@genius-unu/admin`)
* **Purpose:** Dashboard admin, portal mobile-first Buddy, dan portal mandiri PIC Ormawa PKKMB UNU Yogyakarta 2026.
* **Tech Stack:** Nuxt 4 (Nitro Server), Vue 3, Vite 6 + `@tailwindcss/vite`, Pinia, Lucide Icons, `@phosphor-icons/vue`, Tailwind CSS v4.
* **Port:** `http://localhost:3002` (Production Docker: `4002`)
* **Sub-Portals:**
  * `/` (Control Center Super Admin & CRUD Kuis)
  * `/buddy` (Dedicated Mobile-First Stardew RPG Portal untuk Game Master Buddy)
  * `/ormawa/portal` (Dedicated Standalone Portal untuk PIC Stan Ormawa)

### 3. `backend` (`@genius-unu/backend`)
* **Purpose:** REST API backend service & WebSocket server untuk otentikasi PostgreSQL RBAC, verifikasi presensi QR, penilaian FGD, leaderboard, dan data management.
* **Tech Stack:** Bun runtime, Elysia & Hono Framework, PostgreSQL 16 + Drizzle ORM, TypeScript.
* **Port:** `http://localhost:3001` (Production Docker: `4001`)

### 4. `packages/shared` (`@genius-unu/shared`)
* **Purpose:** Shared TypeScript domain types (Participant, Floor, Booth, Stamp, Leaderboard, Admin, Ormawa, Attendance), API response contracts, and constants.

## Key Commands
```bash
# Install dependencies
bun install

# Run user frontend (Port 3000)
bun run dev:user

# Run admin dashboard & portals (Port 3002)
bun run dev:admin

# Run backend API (Port 3001)
bun run dev:backend

# Run all packages concurrently
bun run dev

# Build all packages
bun run build

# Database schema push & seeder
cd backend && bun run db:push
cd backend && bun run db:seed
```

## Docker Deployment (Production)
```bash
# Rebuild & run all services (PostgreSQL, Backend, User, Admin)
docker compose up -d --build

# Run official seeder inside backend container
docker compose exec backend bun run db:seed
```

## Game Module Development Rules (Plug-and-Play)
* All mini-games are decoupled and dispatched via `frontend/user/src/components/minigames/MiniGameContainer.vue`.
* Game components must accept `props: { content, isCompleted?: boolean }` and emit `@complete(score: number, totalQuestions: number)`.
* Minimum passing score is 70% to earn golden stamps and XP.
* UI theme must follow Stardew Valley Retro RPG aesthetic (Wood `#3a2818`, Parchment `#fbf6e9`, Green `#38761d`).
* Official Quiz Structure: 9 Pos Kuis Resmi di 6 Lantai Aktif (51 Soal Terverifikasi).
* Full guidelines: see `docs/08-PANDUAN-MODUL-GAME-DAN-KONTRIBUSI.md` and `docs/13-PEMETAAN-QUIZ-DATABASE-DAN-CORE-GAMEPLAY.md`.
