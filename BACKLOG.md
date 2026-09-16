# 📋 BACKLOG & STATUS IMPLEMENTASI — GENIUS UNU 2026

Dokumen ini melacak catatan teknis dan status pekerjaan backlog monorepo. Seluruh tugas fundamental dan handoff fitur sebelumnya telah berhasil diimplementasikan dan diuji di lingkungan produksi.

---

## ✅ Tugas yang Telah Selesai Diimplementasikan (Completed Tasks)

### 1. 🔐 [BACKEND] Role `ORMAWA_PIC` & Autentikasi Standalone Portal
* **Status:** ✅ SELESAI & TERUJI
* **Implementasi:**
  - Enum `userRoleEnum` memuat role `'ORMAWA_PIC'`.
  - Kolom `pic_user_id` dan `logo_url` aktif pada tabel `ormawa_booths`.
  - Endpoint `POST /api/ormawa/scan-maba` dan `POST /api/ormawa/scan` aktif dengan validasi otentikasi role `ORMAWA_PIC`.
  - Seeder otomatis membuat 19 akun login resmi PIC Ormawa (`pic_<kode_ormawa>`).
  - Proteksi form login: data testing dan kredensial hardcode telah dibersihkan total.

### 2. 📱 [FRONTEND USER] QR Code Mahasiswa Baru & Minat Ormawa
* **Status:** ✅ SELESAI & TERUJI
* **Implementasi:**
  - QR Code MABA dinamis ditampilkan di `OrmawaExpoView.vue` untuk discan oleh PIC Stan.
  - Formulir pendaftaran minat bergabung Ormawa (+25 XP) terhubung ke tabel `ormawa_interests`.
  - Mini-game TTS diperbarui menggunakan Sparse CSS Grid 9 kolom yang responsif di mobile.

### 3. 🖥️ [FRONTEND ADMIN] Portal Mandiri PIC Ormawa & Game Master Buddy
* **Status:** ✅ SELESAI & TERUJI
* **Implementasi:**
  - Dedicated Portal PIC Stan Ormawa (`/ormawa/portal`, `/ormawa/portal/visitors`, `/ormawa/scan`) dengan layout mandiri tanpa sidebar admin.
  - Dedicated Mobile-First Buddy RPG Portal (`/buddy`, `/buddy/fgd`, `/buddy/bonus`, `/buddy/leaderboard`) untuk penilaian rubrik FGD dan monitoring bimbingan.
  - Standarisasi data ke 9 Pos Resmi Kuis PKKMB di 6 Lantai aktif.

---

## 📌 Catatan Operasional & Pemeliharaan (Maintenance Notes)

1. **Sinkronisasi Database di VPS:**
   * Setiap kali ada perubahan skema Drizzle ORM, container backend otomatis mengeksekusi `bun run db:push` saat startup container.
   * Seeder data resmi dijalankan manual satu kali via:
     ```bash
     docker compose exec backend bun run db:seed
     ```

2. **Pembersihan Cache Pasca-Deploy:**
   * Jika tampilan browser belum terupdate, jalankan:
     ```bash
     docker compose build --no-cache user admin
     docker compose up -d --force-recreate user admin
     ```
