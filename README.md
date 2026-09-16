# GENIUS UNU Yogyakarta 2026 — Monorepo

> **Platform Orientasi Kampus Interaktif Berbasis Gamifikasi RPG & Eksplorasi Kampus UNU Yogyakarta.**  
> _Tema Resmi: "Upgrade New U 2026"_

[![Vue.js](https://img.shields.io/badge/Frontend_User-Vue_3.5_+_Vite_6-4FC08D?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![Nuxt](https://img.shields.io/badge/Frontend_Admin-Nuxt_4_+_Nitro-00DC82?style=flat-square&logo=nuxtdotjs)](https://nuxt.com/)
[![Elysia/Hono](https://img.shields.io/badge/Backend-Elysia_&_Hono-E36002?style=flat-square)](https://elysiajs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle_ORM-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![Bun](https://img.shields.io/badge/Runtime-Bun_1.3-f472b6?style=flat-square&logo=bun)](https://bun.sh/)
[![Docker](https://img.shields.io/badge/Container-Docker_Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Ringkasan Arsitektur & Status Implementasi

Sistem GENIUS UNU 2026 dibangun menggunakan arsitektur **Bun Workspaces Monorepo** terintegrasi, menghubungkan ribuan Mahasiswa Baru (MABA), Game Master Buddy, Penjaga Stan Ormawa, dan Panitia Inti dalam satu ekosistem waktu nyata (*real-time*).

```text
genius_project/
├── frontend/
│   ├── user/                    # [@genius-unu/user] Aplikasi MABA (Vue 3 + Vite 6 + Pinia)
│   │   ├── src/
│   │   │   ├── components/      # UI components, Mini-games (TTS, Tebak Kata, Kuis Balapan, dsb)
│   │   │   ├── views/           # Dashboard, Peta, Play, Team, Profile, Attendance, OrmawaExpo
│   │   │   ├── store/           # Pinia gameStore (Sync server, offline fallback, cache)
│   │   │   └── lib/             # API Client, sound effects, question shuffler
│   │   └── package.json
│   │
│   └── admin/                   # [@genius-unu/admin] Dashboard Panitia & Portal (Nuxt 4 + Nitro)
│       ├── app/
│       │   ├── pages/           # Control Center, Buddy Portal, Ormawa PIC Portal, CRUD Kuis
│       │   ├── components/      # Layouts, Sidebar, Modals, Scanner QR, Leaderboard tables
│       │   ├── layouts/         # default.vue (Superadmin / Buddy RPG / Ormawa Standalone)
│       │   └── composables/     # useAuth (PostgreSQL RBAC session), useApi
│       └── package.json
│
├── backend/                     # [@genius-unu/backend] REST API & WebSocket (Bun + Elysia/Hono)
│   ├── src/
│   │   ├── db/                  # Drizzle ORM Schema, PostgreSQL pool, PGlite local fallback
│   │   ├── routes/              # auth, users, teams, attendance, ormawa, leaderboard, scores
│   │   ├── seed.ts              # Seeder resmi (Admin, Buddy, 100 Maba, 50 Kelompok, 19 Ormawa, 9 Pos)
│   │   └── index.ts             # Server entrypoint & WebSocket handler
│   └── package.json
│
├── packages/
│   └── shared/                  # [@genius-unu/shared] Kontrak tipe data bersama (TypeScript)
│       └── src/types/           # game.ts, auth.ts, api.ts
│
├── docker/                      # Dockerfile multi-stage production
│   ├── backend.Dockerfile       # Auto drizzle db:push saat startup container
│   ├── user.Dockerfile          # Nginx reverse proxy + static client build
│   └── admin.Dockerfile         # Nuxt Nitro node-server runner
│
├── docker-compose.yml           # Orkestrasi 4 kontainer (PostgreSQL, Backend, User, Admin)
└── docs/                        # Dokumentasi teknis & pedoman resmi
```

---

## 👥 4 Portal Pengguna Berbasis Peran (RBAC)

Aplikasi memiliki antarmuka khusus yang terisolasi sesuai perannya masing-masing:

### 1. 🎓 Portal Mahasiswa Baru (`@genius-unu/user` - Port 3000 / 4000)
* **Gamifikasi Eksplorasi 6 Lantai (9 Pos Resmi):** Tantangan pos mini-game (TTS Sparse Layout, Tebak Kata, Tebak Posisi, Kuis Cepat, dsb) dengan batas nilai kelulusan minimal 70% untuk meraih Stempel Emas & XP.
* **Presensi Mandiri Dinamis (QR Scanner):** Check-in pagi & Check-out sore dengan token QR terenkripsi yang di-refresh berkala oleh panitia.
* **Ormawa Expo (Lantai 3, 4, 5):** Eksplorasi 19 stan UKM/Organisasi Mahasiswa, pemindaian QR booth stan (+75 XP), dan pendaftaran form minat (+25 XP).
* **Tim & Rumah Adat Nusantara:** Data kelompok resmi menggunakan nama rumah adat Nusantara (*Jabu, Bolon, Gadang, Limas, Lontik*, dll).
* **Leaderboard & Profil:** Papan peringkat realtime individu & kelompok, kustomisasi avatar Stardew Valley, dan catatan progres stempel.

### 2. 🛡️ Portal Game Master Buddy (`/buddy`)
* **Mobile-First Retro RPG View:** Tampilan khusus ramah ponsel dengan tema Stardew Valley tanpa sidebar admin yang mengganggu.
* **Manajemen Binaan:** Pantau progres stempel dan perolehan poin 20 mahasiswa bimbingan secara instan.
* **Form Penilaian Rubrik FGD:** Input nilai diskusi kelompok (Keaktifan, Kedalaman Materi, Adab) langsung tersimpan ke database.
* **Bonus & Apresiasi:** Pemberian stempel dan poin apresiasi keaktifan regu.

### 3. 🎪 Portal Mandiri PIC Stan Ormawa (`/ormawa/portal` & `/ormawa/login`)
* **Portal Terisolasi:** PIC Ormawa memiliki rute login tersendiri dengan akses terbatas hanya ke stannya masing-masing.
* **QR Stan & Scanner:** Menampilkan QR Stan untuk dipindai maba, serta scanner kamera untuk validasi kehadiran pengunjung stan.
* **Buku Tamu & Rekap Minat:** Melihat daftar maba yang berminat bergabung beserta nomor kontak WhatsApp dan alasan ketertarikannya secara *real-time*.

### 4. 👑 Control Center Super Admin (`/` & `/pages/*`)
* **Pusat Monitoring Realtime:** Pantau metrik kehadiran, total XP diterbitkan, dan traffic tiap lantai.
* **Manajemen Pengguna & Roster:** Pencarian NIM, reset password massal ke default, filter fakultas/prodi, dan ekspor data CSV.
* **Master Kuis & Pos:** Konfigurasi soal kuis resmi 9 pos, buka-tutup akses pos, serta audit transaksi poin.
* **Proyektor & QR Center:** Layar proyektor leaderboard panggung dan display token QR presensi dinamis.

---

## 🧩 Pemetaan 9 Pos Kuis Resmi (Database Terverifikasi)

Sistem kuis telah distandarisasi dari dataset resmi kepanitiaan ke dalam 9 Pos di 6 Lantai aktif:

| Lantai | Kode Pos | Nama Pos / Tema | Jenis Mini-Game | Jumlah Soal | Bobot Nilai |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **Lt. 1** | `POS-1` | Sejarah & Nilai Luhur UNU | Tebak Kata | 5 Soal | 100 Poin |
| **Lt. 1** | `POS-2` | Aswaja & Ke-NU-an | Pilihan Ganda | 5 Soal | 100 Poin |
| **Lt. 2** | `POS-3` | Visi Kampus & Masa Depan | Pilihan Ganda | 5 Soal | 100 Poin |
| **Lt. 4** | `POS-4` | Satgas PPKS & Ruang Aman | TTS (Teka-Teki Silang) | 5 Soal | 100 Poin |
| **Lt. 4** | `POS-5` | Kampus Sehat & Bebas Narkoba | Pilihan Ganda | 5 Soal | 100 Poin |
| **Lt. 6** | `POS-6` | Etika Akademik & Fasilitas | Pilihan Ganda | 5 Soal | 100 Poin |
| **Lt. 6** | `POS-7` | Riset & Budaya Inovasi | Pilihan Ganda | 5 Soal | 100 Poin |
| **Lt. 7** | `POS-8` | Technopreneur & Karier | Pilihan Ganda | 5 Soal | 100 Poin |
| **Lt. 9** | `POS-9` | Puncak Komitmen Mahasiswa | Pilihan Ganda | 6 Soal | 100 Poin |

---

## 🚀 Panduan Menjalankan Proyek

### Opsi A: Menggunakan Docker Compose (Direkomendasikan untuk Production / VPS)

Orkestrasi kontainer sudah dilengkapi dengan otomatisasi migrasi database skema saat startup:

```bash
# 1. Jalankan seluruh layanan (PostgreSQL, Backend, User, Admin)
docker compose up -d --build

# 2. Jalankan seeder database resmi (Pertama kali setup)
docker compose exec backend bun run db:seed

# 3. Cek status dan log kontainer
docker compose logs -f backend
```

| Container | Image / Dockerfile | Port Eksternal | Keterangan |
| :--- | :--- | :---: | :--- |
| `genius_postgres` | `postgres:16-alpine` | `5433` | Database PostgreSQL utama |
| `genius_backend` | `docker/backend.Dockerfile` | `4001` | API Elysia/Hono + WebSocket |
| `genius_user` | `docker/user.Dockerfile` | `4000` | Nginx + Build SPA Maba |
| `genius_admin` | `docker/admin.Dockerfile` | `4002` | Nuxt 4 Nitro Server Panitia |

---

### Opsi B: Pengembangan Lokal (Local Development)

#### 1. Instalasi Dependensi
```bash
bun install
```

#### 2. Jalankan Layanan Lokal
```bash
# Jalankan seluruh workspace secara paralel
bun run dev

# Atau jalankan per-layanan:
bun run dev:user      # http://localhost:3000 (Aplikasi MABA)
bun run dev:admin     # http://localhost:3002 (Dashboard & Portal Admin)
bun run dev:backend   # http://localhost:3001 (API Service)
```

#### 3. Manajemen Skema & Seeder Database
```bash
# Sinkronkan skema TypeScript Drizzle ke database
cd backend
bun run db:push

# Eksekusi seeder lengkap (Admin, 10 Buddy, 100 Maba, 50 Regu, 19 Ormawa, 9 Pos)
bun run db:seed

# Buka visual viewer database via browser
bun run db:studio
```

---

## 🔐 Keamanan & Autentikasi

* **Arsitektur Tanpa Mock Data di Production:** Seluruh proses autentikasi diverifikasi langsung ke tabel `users` PostgreSQL menggunakan perbandingan password hash `bcrypt` dan session `JWT`.
* **Proteksi Form Login:** Halaman login bersih dari hardcode data testing untuk mencegah kebocoran kredensial di lingkungan publik.
* **Role-Based Middleware Guard:** Rute `/buddy/*` hanya dapat dibuka oleh user dengan role `BUDDY` dan `ADMIN`, rute `/ormawa/*` hanya dapat dibuka oleh `ORMAWA_PIC`, dan rute sistem hanya dapat diakses oleh `ADMIN`.

---

## 📚 Indeks Dokumentasi Terstruktur (`docs/`)

Detail spesifikasi teknis dan rationale arsitektur tersimpan di folder [`docs/`](./docs/):
- 📑 [**01. Pemetaan Rundown 3 Hari ke Fitur Aplikasi**](./docs/01-RUNDOWN-DAN-EVENT-FLOW.md)
- 🏗️ [**02. Arsitektur Sistem & Spesifikasi Tech Stack**](./docs/02-ARSITEKTUR-DAN-TECH-STACK.md)
- ⚙️ [**04. Spesifikasi Fitur Utama & Logika Gamifikasi**](./docs/04-SPESIFIKASI-FITUR-UTAMA.md)
- 📡 [**05. Spesifikasi Kontrak REST API Backend**](./docs/05-SPESIFIKASI-REST-API.md)
- 🎮 [**08. Panduan Modul Game & Kontribusi**](./docs/08-PANDUAN-MODUL-GAME-DAN-KONTRIBUSI.md)
- 📋 [**11. Sistem Presensi Sesi Dinamis**](./docs/11-SISTEM-PRESENSI-SESI-FLEKSIBEL.md)
- 🏛️ [**12. Rationale Arsitektur: PostgreSQL + Drizzle ORM**](./docs/12-RATIONALE-TECH-STACK-POSTGRESQL-VS-MONGODB.md)
- 🧩 [**13. Pemetaan Kuis Resmi & Core Gameplay dari CSV**](./docs/13-PEMETAAN-QUIZ-DATABASE-DAN-CORE-GAMEPLAY.md)
- 🌱 [**14. Panduan Eksekusi Seeder & Manajemen CRUD Kuis Admin**](./docs/14-PANDUAN-SEED-DAN-CRUD-ADMIN-KUIS.md)

---

## 📜 Lisensi & Hak Cipta

Dikembangkan untuk Panitia Orientasi Mahasiswa Baru (PKKMB) 2026 Universitas Nahdlatul Ulama Yogyakarta. Hak cipta dilindungi undang-undang.
