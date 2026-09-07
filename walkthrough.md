# 🎮 Walkthrough — Implementasi Sistem Presensi Sesi Fleksibel & Dinamis

## 📌 Ringkasan Pekerjaan
Telah berhasil diimplementasikan **Sistem Presensi Berbasis Sesi Dinamis (*Session-Driven Dynamic Attendance*)** untuk PKKMB UNU Yogyakarta 2026. Sistem ini menghapus pembatasan kaku "Hari 1, Hari 2, Hari 3", memungkinkan panitia membuat dan mengaktifkan sesi presensi apapun (*Check-In* Kedatangan atau *Check-Out* Kepulangan) dengan perolehan poin XP otomatis, pencegahan titip absen, dan live QR projector.

---

## 🏗️ Komponen yang Diubah & Diperbarui

### 1. Database Schema & Migration (`backend/src/db/schema.ts`)
- **Tabel Baru `attendance_sessions`**:
  - Menyimpan `id` (UUID), `title`, `description`, `type` (`CHECK_IN` / `CHECK_OUT`), `isActive`, `qrToken`, `xpReward`, `allowLate`, `lateTime`, `startTime`, `endTime`.
  - Push migration sukses ke PostgreSQL via `drizzle-kit push`.
- **Tabel `attendances`**:
  - Menambahkan relasi foreign key `sessionId` ke `attendance_sessions.id`.
  - Menambahkan index `idx_attendances_session_participant` untuk optimasi pencarian cepat.

### 2. Backend REST API (`backend/src/routes/attendance.ts`)
- **Active Session Endpoints**:
  - `GET /api/attendance/active-session`: Mengembalikan sesi yang sedang dibuka oleh panitia.
  - `GET /api/attendance/sessions`: Menampilkan seluruh sesi presensi.
  - `POST /api/attendance/sessions`: Membuat sesi presensi baru dengan konfigurasi waktu & XP kustom.
  - `PUT /api/attendance/sessions/:id/activate`: Mengaktifkan 1 sesi gerbang dan menonaktifkan sesi lain.
  - `PUT /api/attendance/sessions/:id/deactivate`: Menutup gerbang presensi.
  - `PUT /api/attendance/sessions/:id` & `DELETE /api/attendance/sessions/:id`: Manajemen CRUD sesi.
- **Universal Flexible Scanner (`POST /api/attendance/scan`)**:
  - Otomatis mendeteksi jenis sesi aktif (`CHECK_IN` atau `CHECK_OUT`).
  - Mendukung token QR proyektor dengan salt 5 menit (`TOKEN-SALT`).
  - Evaluasi keterlambatan presensi berdasarkan `lateTime`.
  - Mencegah dobel scan (`ALREADY_ATTENDED`).
  - Menambahkan perolehan poin XP mahasiswa dan mencatat ke `scoreTransactions`.
  - Memancarkan event WebSocket (`ATTENDANCE_CHECK_IN`, `ATTENDANCE_CHECK_OUT`) untuk update realtime Leaderboard & Admin HUD.
- **Session-Aware Recap & Batch Operations**:
  - `GET /api/attendance/recap?sessionId=...`
  - `POST /api/attendance/batch-check-in`, `/batch-check-out`, `/batch-reset`.

### 3. Admin Dashboard (`frontend/admin/pages/attendance.vue` & `components/qr/GateProjectorModal.vue`)
- **Menghapus Tab Kaku Hari 1 / 2 / 3**: Digantikan dengan **Active Session Command Center**.
- **Hero Status Gerbang**: Menampilkan sesi aktif secara real-time, tipe sesi (`CHECK_IN` vs `CHECK_OUT`), status jam buka, batas keterlambatan, dan perolehan XP.
- **Quick Controls**:
  - Tombol **"Buka/Tutup Gerbang"**: Cepat membuka/menutup presensi.
  - Tombol **"Buka Proyektor Gerbang"**: Menghubungkan ke `GateProjectorModal` dengan QR dinamis yang berotasi otomatis tiap 5 menit.
  - Tombol **"Kelola Sesi"**: Modal manajemen sesi lengkap dengan tombol template instan (*Check-In Masuk Pagi* / *Check-Out Kepulangan Sore*).
- **Rekapitulasi & Batch Actions**: Filter rekap per sesi dengan dukungan aksi massal manual check-in, check-out, atau reset.

### 4. User Frontend (`frontend/user/src/views/AttendanceView.vue` & `api.ts`)
- Menghapus tab kaku "Hari 1 / Hari 2 / Hari 3".
- **Dynamic Active Gate Card**: Otomatis mendeteksi sesi aktif panitia.
  - Jika sesi `CHECK_IN`: Tombol hijau bercahaya **"PINDAI QR GERBANG KEDATANGAN (+100 XP)"**.
  - Jika sesi `CHECK_OUT`: Tombol biru bercahaya **"PINDAI QR GERBANG KEPULANGAN (+50 XP)"**.
  - Jika sudah presensi: Kartu terverifikasi hijau dengan catatan jam kedatangan/kepulangan.
  - Jika belum ada sesi yang dibuka: Kartu cozy RPG yang menginfokan gerbang belum dibuka panitia beserta tombol cek ulang status.
- **Riwayat Presensi Mandiri**: Daftar riwayat seluruh sesi presensi yang telah diselesaikan mahasiswa.
- **Kuesioner Refleksi**: Tetap tersedia untuk memberikan masukan dan mendapatkan reward bonus +25 XP.

### 5. Dokumentasi Resmi (`docs/11-SISTEM-PRESENSI-SESI-FLEKSIBEL.md`)
- Dokumentasi teknis komprehensif mencakup:
  - Latar belakang arsitektur & konsep *single active gate*.
  - Skema database PostgreSQL.
  - Spesifikasi lengkap 12 REST API endpoints.
  - Diagram alur kerja presensi.
  - Panduan operasional untuk Panitia/Admin dan Mahasiswa.
  - Tabel mitigasi masalah (*troubleshooting*).

---

## 🧪 Hasil Verifikasi & Uji Coba

| Skenario Uji | Target | Hasil |
| :--- | :--- | :--- |
| **Push Database Schema** | PostgreSQL `genius_2026` | ✅ Sukses (`attendance_sessions` & `attendances.session_id` aktif) |
| **Build Frontend Admin** | Nuxt 3 / Vite 7 (`frontend/admin`) | ✅ Sukses (Exit code 0, 0 error) |
| **Build Frontend User** | Vue 3 / Vite 8 (`frontend/user`) | ✅ Sukses (Exit code 0, 0 error) |
| **Active Session Query** | `GET /api/attendance/active-session` | ✅ Sukses (Mereturn sesi aktif saat ini) |
| **List Sesi Presensi** | `GET /api/attendance/sessions` | ✅ Sukses (2 sesi awal tersimpan) |
| **Universal Scan Check-In** | `POST /api/attendance/scan` | ✅ Sukses (+100 XP tercatat, `ON_TIME`) |
| **Universal Scan Check-Out** | `POST /api/attendance/scan` | ✅ Sukses (+50 XP bonus kepulangan) |
| **Pencegahan Dobel Scan** | `POST /api/attendance/scan` (ulang) | ✅ Sukses (`ALREADY_ATTENDED` 400 Bad Request) |
| **Rekapitulasi Presensi** | `GET /api/attendance/recap` | ✅ Sukses (Menyajikan summary & list per sesi) |

Semua persyaratan telah terpenuhi dengan rapi dan sistem siap digunakan secara fleksibel!
