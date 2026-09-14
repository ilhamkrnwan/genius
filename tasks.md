# 📋 GENIUS UNU 2026 — Roadmap & Tasks Eksekusi Modular

> **Tujuan:** Menerapkan alur menu terpadu dan aturan baru sistem presensi berbasis bimbingan Buddy (tanpa scan QR mandiri) secara bertahap, modular, dan teruji per task.

---

## 🗂️ Daftar Tugas (Task List)

- [x] **Task 1: Smart Guarded Flow dari Beranda ke Menu & Kartu Profil Dinamis**
  - **Fokus:** Menghubungkan tombol *"MULAI PERJALANAN"* dan tombol Controller dock di Beranda (`HeroSection.vue`) dengan logika kondisional:
    - Jika peserta **belum login/onboard**: Munculkan pemilih avatar dan modal Onboarding (Login NIM & Pilih Avatar RPG). Setelah selesai $\rightarrow$ redirect otomatis ke Halaman Menu (`/play`).
    - Jika peserta **sudah login/terdaftar (misal: Laki-laki / Ilham Kurniawan)**: Kartu karakter secara otomatis menampilkan **Data Profil Peserta** lengkap (Avatar Cowok berpeci & jas, Nama, NIM, Program Studi, Fakultas, Level RPG, Total XP, Stempel, dan tombol Ubah Profil), menggantikan toggle Cowok/Cewek.
    - Tombol aksi utama otomatis berubah menjadi *"LANJUTKAN PENJELAJAHAN"* menuju Lobby Menu (`/play`).
  - **File:** `frontend/user/src/components/landing/HeroSection.vue`
  - **Status Verifikasi:** Selesai & Build Verified (Exit Code 0).

---

- [x] **Task 2: Penyempurnaan Halaman Menu / Lobby Petualangan (`/play`)**
  - **Fokus:** Menjadikan `/play` sebagai pusat komando dan navigasi utama peserta sebelum masuk ke pos/lantai:
    - Menampilkan kartu identitas RPG peserta (Avatar Cowok/Cewek Jas UNU, Nama, NIM, Prodi, Level RPG "New You" s/d "Upgraded You", Total XP).
    - Tombol aksi utama: *"LANJUTKAN MISI LANTAI X"* / *"MULAI MISI LANTAI 1"* dengan rekap stempel pos (0/18 Stempel).
    - Grid 6 portal menu interaktif:
      1. 🧭 **PETA KAMPUS** (`/peta`) — Denah 9 lantai & status pos.
      2. 📋 **PRESENSI KEHADIRAN** (`/presensi`) — Status absensi oleh Buddy (6 sesi H1-H3).
      3. 🎪 **ORMAWA EXPO** (`/ormawa`) — Pameran UKM selasar lantai 3-5 & lencana.
      4. 🎖️ **PASPOR DIGITAL** (`/paspor`) — Koleksi 18 stempel emas & sertifikat.
      5. 🏆 **PAPAN PERINGKAT** (`/leaderboard`) — Leaderboard live individu & kelompok.
      6. 📖 **PANDUAN & BANTUAN** (`/bantuan`) — Aturan main, FAQ & posko bantuan.
    - Integrasi modal ubah profil cepat.
  - **File:** `frontend/user/src/views/PlayView.vue`
  - **Status Verifikasi:** Selesai & Build Verified (1.30s, Exit Code 0).

---

- [x] **Task 3: Implementasi Sistem Presensi Baru ("Di-absen oleh Buddy")**
  - **Fokus:** Mengganti mekanisme scan QR mandiri dengan pelacak progres presensi yang diverifikasi oleh Buddy:
    - Menampilkan rekapitulasi sesi: Total **6 Sesi Presensi (3 Hari $\times$ 2 Sesi: Masuk & Pulang)**.
    - Menampilkan indikator kehadiran peserta: sudah sampai mana sesi yang dihadirinya (contoh: *Hari 1 Masuk ✅, Hari 1 Pulang ✅, Hari 2 Masuk ⏳, dst.*).
    - Indikator status visual per sesi:
      - 🟢 **Terverifikasi Hadir (On-Time / Terlambat)** (+100 XP / +50 XP).
      - ⏳ **Sedang Berlangsung / Menunggu Verifikasi Buddy**.
      - 🔒 **Belum Dibuka / Sesi Berikutnya**.
    - Kuesioner Refleksi Harian (3 rating bintang + esai masukan) untuk bonus +25 XP harian.
    - Banner edukasi: *"Anda tidak perlu scan QR mandiri, kehadiran divalidasi langsung oleh Kakak Buddy."*
  - **File:** `frontend/user/src/views/AttendanceView.vue`, `frontend/user/src/store/gameStore.ts`
  - **Status Verifikasi:** Selesai & Build Verified (1.15s, Exit Code 0).

---

- [x] **Task 4: Dukungan Data & Mock State Presensi Buddy di Store & Admin**
  - **Fokus:** Memastikan model data dan sinkronisasi antara aksi Buddy dan tampilan peserta:
    - Getter dan helper di `gameStore` untuk menghitung total sesi yang terverifikasi (`attendedSessionsCount`), total XP presensi, dan status per hari.
    - Dukungan fallback offline/localStorage agar data tetap tersimpan saat reload.
    - Penyelarasan format presensi dengan Portal Buddy di Admin (`frontend/admin`).
  - **File:** `frontend/user/src/store/gameStore.ts`, `frontend/user/src/types/attendance.ts`
  - **Status Verifikasi:** Selesai & Reaktivitas State Terverifikasi.

---

- [x] **Task 5: Verifikasi Menyeluruh & Testing Alur Pengguna (E2E Flow)**
  - **Fokus:** Menguji alur lengkap dari Beranda $\rightarrow$ Onboarding $\rightarrow$ Menu Lobby $\rightarrow$ Cek Presensi $\rightarrow$ Mulai Game Lantai:
    - Skenario A: Pengguna Baru (Tamu) $\rightarrow$ Klik Mulai $\rightarrow$ Modal Onboarding $\rightarrow$ Menu $\rightarrow$ Masuk Lantai 1.
    - Skenario B: Pengguna Terdaftar (misal: Ilham Kurniawan / Laki-laki) $\rightarrow$ Ditampilkan Kartu Profil Peserta di Beranda $\rightarrow$ Tombol *"LANJUTKAN PENJELAJAHAN"* $\rightarrow$ Langsung masuk ke Menu Lobby (`/play`).
    - Skenario C: Navigasi Menu ke Presensi $\rightarrow$ Menampilkan 6 sesi presensi bimbingan Buddy (H1-H3) lengkap dengan progres, status verifikasi, dan form refleksi tanpa scanner kamera QR.
  - **Status Verifikasi:** `bun run build` monorepo lulus 100% (0 error), Vite User Frontend aktif di `http://localhost:3000`.
