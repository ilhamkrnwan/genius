# 14. Panduan Eksekusi Seeder & Manajemen CRUD Kuis Admin PKKMB GENIUS UNU 2026

Dokumen ini adalah panduan teknis dan operasional untuk mengelola database kuis, menjalankan *seeder* otomatis, mengintegrasikan pratinjau media Google Drive berbasis `<iframe>`, dan melakukan operasi CRUD (*Create, Read, Update, Delete*) bank soal melalui **Dashboard Admin GENIUS 2026**.

---

## 1. Arsitektur Seeder & Perintah Eksekusi

Sistem backend GENIUS UNU 2026 mendukung **Dual Engine Database**:
* **PGlite (Embedded WASM, Default Lokal):** Beroperasi secara *zero-configuration* tanpa instalasi server database atau Docker. File database tersimpan otomatis di `backend/data/pglite_db` dengan eksekusi migrasi skema otomatis.
* **PostgreSQL Server (Staging / Production):** Diaktifkan otomatis saat environment variable `DATABASE_URL` (misal: `postgresql://postgres:password@localhost:5432/genius_db`) disediakan.

---

### A. Matriks Perbandingan Perintah Seeder

| Perintah | Target Sasaran | Sifat Eksekusi | Keterangan & Rekomendasi |
|:---|:---|:---:|:---|
| `bun run db:seed` | Master Data PKKMB Lengkap | ⚠️ **Destruktif (Clean Slate)** | Menghapus log/transaksi/user lama. Membuat 1 Admin, 10 Buddy, 100 Maba, 5 Regu, 19 Ormawa, 1 Presensi, dan 51 Soal Kuis Resmi. **Gunakan untuk setup awal.** |
| `bun run db:seed:official` | 9 Pos, 12 Game, 51 Soal CSV | 🛡️ **Non-Destruktif (Inkremental)** | Hanya meng-*upsert* master kuis, game, dan lokasi pos. Akun user, presensi, dan riwayat skor **tidak dihapus**. **Sangat direkomendasikan saat perbaikan konten kuis.** |
| `bun run db:seed:quiz` | Draf Kuis Versi Lama | ⚠️ *Legacy / Deprecated* | Skrip draf awal sebelum distandardisasi ke `quiz_database.csv`. Sebaiknya gunakan `db:seed:official`. |
| `bun run db:studio` | Seluruh Tabel Database | 🔍 **Read/Write GUI** | Membuka Drizzle Studio web di browser untuk inspeksi visual tabel data. |

---

### B. Seeder Kuis Resmi (Inkremental & Aman / Non-Destruktif)
Digunakan untuk memasukkan atau menyinkronkan seluruh 9 Pos, 12 Game Engine, 9 Misi, dan 51 butir soal dari `quiz_database.csv` **tanpa** menghapus akun pengguna (Admin, Buddy, Mahasiswa Baru), presensi, maupun riwayat transaksi yang sudah ada.

```bash
# Jalankan dari root workspace
bun run db:seed:official

# Atau langsung dari direktori backend
cd backend && bun run db:seed:official
```

**Hasil Eksekusi:**
* Memastikan 9 Lantai Kampus Terpadu UNU terdaftar di tabel `floors`.
* Memastikan 9 Lokasi Pos Resmi (`POS-L1-1` s/d `POS-L6-8`) aktif di tabel `locations`.
* Mendaftarkan 12 Game Engine di tabel `games` dengan instruksi, batas waktu, dan bobot skor 100 poin.
* Menautkan 9 Misi utama di tabel `missions` ke lokasi pos bersangkutan.
* Melakukan *upsert* 51 butir soal resmi ke tabel `questions`.

---

### C. Seeder Penuh Clean-Slate (Inisialisasi Awal Sistem)
Digunakan saat inisialisasi awal lingkungan staging/produksi untuk menyiapkan seluruh master data kegiatan PKKMB 3 hari dari nol:

```bash
# Jalankan dari root workspace
bun run db:seed

# Atau dari direktori backend
cd backend && bun run db:seed
```

**Data yang Dihasilkan:**
* 1 Akun Master Admin (`username: admin`, `password: admin2026`).
* 50 Akun Buddy Resmi (`username: buddy01` s/d `buddy50`, `password: buddy2026`).
* 100 Akun Mahasiswa Baru (`NIM 26111101` s/d `26111200`, `password: genius2026`).
* 50 Kelompok Resmi (`Genius 01` s/d `Genius 50`), masing-masing beranggotakan Maba + Buddy pendamping.
* 19 Booth Ormawa / UKM Expo di Lantai 3, 4, dan 5 lengkap dengan QR presensi.
* 1 Sesi Presensi Kehadiran Pagi Hari 1.
* **Seluruh 51 butir soal resmi 9 Pos** (otomatis diintegrasikan pada langkah 9/9).

---

## 2. Struktur 9 Pos Kuis Resmi (6 Lantai)

Setiap Pos bernilai akumulasi tepat **100 Poin**, dengan total nilai ekspedisi kampus sebesar **900 Poin**.

| Pos | Lantai | Kode Lokasi | Nama Pos & Topik CSV | Tipe Game Frontend | Tipe DB (`games.type`) | Total Soal / Butir | Penskoran |
|:---:|:---:|:---:|:---|:---|:---:|:---:|:---|
| **Pos 1** | **Lantai 1** | `POS-L1-1` | Anti Korupsi & Terorisme | `kuis_cepat` | `QUIZ` | 8 Soal | `[13, 12, 13, 12, 13, 12, 13, 12]` = **100 Pts** |
| **Pos 2** | **Lantai 2** | `POS-L2-2` | Leadership & Problem Solving | `memory_match` | `MEMORY` | 5 Pasang Kartu | `[15, 20, 25, 15, 25]` = **100 Pts** |
| **Pos 6** | **Lantai 2** | `POS-L2-6` | Media Sosial & Komunikasi | `kuis_cepat` | `QUIZ` | 8 Soal | `[13, 12, 13, 12, 13, 12, 13, 12]` = **100 Pts** |
| **Pos 3** | **Lantai 3** | `POS-L3-3` | Profil Pelajar Pancasila | `benar_salah` | `RAPID_ANSWER` | 5 Soal | `[15, 20, 20, 20, 25]` = **100 Pts** |
| **Pos 4** | **Lantai 4** | `POS-L4-4` | Kampus Bersinar Bebas Narkoba | `tts` | `PUZZLE` | 5 Kata Silang | 5 kata x 20 = **100 Pts** |
| **Pos 9** | **Lantai 4** | `POS-L4-9` | Ingat Aku (Teks Blur & Tokoh NU) | `tebak_gambar` | `IMAGE_GUESS` | 5 Soal | 5 soal x 20 = **100 Pts** *(Iframe GDrive)* |
| **Pos 5** | **Lantai 5** | `POS-L5-5` | Anti Plagiarisme & Integritas | `tebak_kata` | `WORD_GAME` | 5 Riddle Kata | `[10, 20, 20, 25, 25]` = **100 Pts** |
| **Pos 7** | **Lantai 6** | `POS-L6-7` | Fun Pos Tebak Gambar & Audio | `tebak_gambar` | `IMAGE_GUESS` | 5 Soal | 5 soal x 20 = **100 Pts** *(Iframe GDrive)* |
| **Pos 8** | **Lantai 6** | `POS-L6-8` | Ingat Aku (Tebak Posisi Lantai) | `tebak_posisi` | `LOGIC` | 5 Soal | 5 soal x 20 = **100 Pts** *(Iframe GDrive)* |

---

## 3. Integrasi Media Google Drive Berbasis Iframe Preview

Untuk memudahkan panitia dan admin dalam menyiapkan gambar soal tanpa perlu mengunggah ulang file gambar/audio berukuran besar ke server, sistem mendukung **penyematan otomatis berbasis Google Drive File ID**.

### A. Cara Kerja Integrasi
1. **Input di Sisi Admin (`questions.vue`):**
   * Admin cukup menempelkan URL file Google Drive (misal: `https://drive.google.com/file/d/1vN78n3Z.../view?usp=drivesdk`) atau langsung File ID-nya (`1vN78n3Z...`).
   * Dashboard Admin otomatis mengekstrak File ID menggunakan regex:
     ```ts
     const match = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
     const fileId = match ? match[1] : input.trim();
     ```
   * File ID disimpan ke dalam array `tags` pada tabel database PostgreSQL dengan format: `gdrive:${fileId}`.

2. **Penyajian di Sisi Pengguna (Maba):**
   * Komponen game ([`TebakGambarGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakGambarGame.vue) dan [`TebakPosisiGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakPosisiGame.vue)) mendeteksi keberadaan tag `gdrive:` atau link Google Drive.
   * Komponen menyusun URL embed standar:
     ```
     https://drive.google.com/file/d/{FILE_ID}/preview
     ```
   * Merender pratinjau dalam container responsif:
     ```html
     <iframe
       :src="gdriveEmbedUrl"
       class="w-full h-full border-0 rounded-lg pointer-events-none"
       allow="autoplay"
       sandbox="allow-scripts allow-same-origin"
       loading="lazy"
     />
     ```

### B. Pengecualian Folder TTS
> [!IMPORTANT]
> Tautan `https://drive.google.com/drive/folders/1da1JDYvj5RpNv4Io7qnMpJhLCG71OWVS` pada Pos 4 adalah tautan **Folder Google Drive**, bukan single file gambar. Link ini merupakan rujukan arsip dokumen panitia dan **tidak** di-embed ke dalam iframe. Permainan TTS Pos 4 dirender murni secara interaktif via komponen Vue canvas [`TtsGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TtsGame.vue).

### C. Syarat Akses File Google Drive
Agar gambar/audio dapat tampil di iframe mahasiswa tanpa login Google:
1. Klik kanan file di Google Drive $\rightarrow$ **Bagikan (Share)** $\rightarrow$ **Akses Umum**.
2. Ubah dari *Dibatasi (Restricted)* menjadi **Siapa saja yang memiliki link (Anyone with the link)** sebagai **Pelihat (Viewer)**.

---

## 4. Panduan Operasional CRUD Kuis di Dashboard Admin

Admin dapat mengelola seluruh bank soal secara dinamis melalui antarmuka web di:
```
http://localhost:3002/questions
```

### A. Melihat & Memfilter Soal (Read)
* **Pencarian Keyword:** Ketik kata kunci pada kotak pencarian untuk mencari teks pertanyaan, penjelasan, atau tag.
* **Filter Kategori Pos:** Dropdown filter mendukung seleksi per pos:
  * Pos 1: Anti Korupsi & Terorisme
  * Pos 2: Leadership
  * Pos 3: Profil Pelajar Pancasila
  * Pos 4: Anti Narkoba
  * Pos 5: Anti Plagiarisme
  * Pos 6: Media Sosial & Komunikasi
  * Pos 7: Fun Pos Tebak Gambar & Audio
  * Pos 8: Ingat Aku (Tebak Posisi)
  * Pos 9: Ingat Aku (Teks Blur & Tokoh NU)
* **Filter Tingkat Kesulitan:** Mudah (EASY), Sedang (MEDIUM), Sulit (HARD).
* **Indikator Media:** Butir soal yang memiliki integrasi Google Drive akan ditandai dengan badge khusus bernuansa biru: `GDRIVE IFRAME`.

### B. Menambah Soal Baru (Create)
1. Klik tombol **+ Tambah Soal** di kanan atas halaman.
2. Isi formulir modal:
   * **Kategori Pos:** Pilih salah satu dari 9 Pos resmi.
   * **Tingkat Kesulitan:** Pilih EASY, MEDIUM, atau HARD.
   * **Tipe Soal:** Pilihan Ganda (`MULTIPLE_CHOICE`), Benar/Salah (`BOOLEAN`), atau Isian (`SHORT_ANSWER`).
   * **Bobot Poin (Base Score):** Tentukan skor nilai soal (pastikan akumulasi total per pos tetap 100).
   * **Google Drive File ID / Link (Opsional):** Jika soal memerlukan gambar/suara, tempel link atau ID file Google Drive di kolom ini.
   * **Teks Pertanyaan:** Tuliskan studi kasus atau deskripsi pertanyaan.
   * **Pilihan Jawaban (A-D / A-E):** Tambahkan opsi jawaban dan tandai radio button untuk opsi yang menjadi **Kunci Jawaban Benar**.
   * **Pembahasan / Feedback:** Penjelasan edukatif yang akan dibaca mahasiswa setelah menjawab.
3. Klik **Simpan Soal**. Soal baru akan langsung tersimpan di PostgreSQL dan tampil pada daftar.

### C. Mengubah Soal yang Ada (Update)
1. Klik tombol ikon **Edit** (pensil) pada kartu soal yang ingin disesuaikan.
2. Seluruh data lama (termasuk kunci jawaban dan ID Google Drive) akan terisi otomatis di dalam modal.
3. Lakukan penyesuaian teks, bobot skor, opsi jawaban, atau ganti file Google Drive.
4. Klik **Simpan Perubahan**. Perubahan akan langsung berdampak pada sesi kuis berikutnya.

### D. Menghapus Soal (Delete)
1. Klik tombol ikon **Hapus** (tempat sampah) pada kartu soal.
2. Konfirmasi tindakan pada dialog modal.
3. Soal akan dihapus permanen dari database.

---

## 5. Sinkronisasi Konfigurasi Game Engine

Jika terdapat penyesuaian batas waktu (countdown), jumlah soal yang disajikan, atau tipe gameplay:
1. Buka menu **Manajemen Game** di dashboard Admin: `http://localhost:3002/games`.
2. Klik tombol **SINKRONKAN DEFAULT GAME** di sudut kanan atas.
3. Sistem akan memanggil endpoint `POST /api/games/sync-defaults` untuk menyelaraskan parameter teknis 12 Game Engine di database PostgreSQL.

---

## 6. Penyelarasan Sisi Buddy (Gatekeeper Regu)

Fasilitator regu (Buddy) memandu 20 mahasiswa di setiap pos melalui antarmuka [`BuddyPosController.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/admin/app/components/buddy/BuddyPosController.vue):
* **Daftar Dropdown Pos:** Otomatis membaca 9 Pos Resmi dari tabel `locations` (`POS-L1-1` s/d `POS-L6-8`).
* **Batas Waktu Fleksibel:** Buddy dapat memilih durasi pengerjaan regu (10 menit, 12 menit, atau 15 menit).
* **Toleransi Sesi Backend:** Endpoint `/api/game-sessions/create` menerima parameter ID berupa UUID murni maupun kode alias pos (`POS-L1-1`), sehingga meminimalisir kegagalan inisialisasi sesi saat hari pelaksanaan.

---

## 7. Troubleshooting & Tanya-Jawab Sering Diajukan (FAQ)

### Q: Gambar di iframe Google Drive muncul pesan "Refused to display" atau kosong?
**Solusi:** Pastikan izin berbagi (sharing permission) di Google Drive sudah diatur ke **"Anyone with the link can view"**. Jika disetel privat, browser peserta akan memblokir rendering demi keamanan akun Google.

### Q: Bagaimana jika koneksi internet di suatu lantai kampus terputus (offline)?
**Solusi:** Frontend User didesain dengan prinsip *Local-First Fallback*. Jika API backend tidak dapat dihubungi, modul kuis secara otomatis beralih menggunakan bank data statis lokal di [`genius2026QuizData.ts`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/data/genius2026QuizData.ts) sehingga permainan tetap dapat diselesaikan regu.

### Q: Bagaimana cara melihat isi database secara visual langsung melalui browser?
**Solusi:** Jalankan Drizzle Studio bawaan proyek:
```bash
bun run db:studio
```
Buka browser pada `https://local.drizzle.team` untuk meninjau tabel `questions`, `games`, `locations`, `missions`, dan `game_sessions`.
