# 📋 Dokumentasi Sistem Presensi Sesi Fleksibel (Session-Driven Dynamic Attendance)
**PKKMB UNU Yogyakarta 2026 — Platform Genius UNU 2026**

---

## 1. Pendahuluan & Filosofi Desain

Sistem Presensi pada platform **Genius UNU 2026** telah dimodernisasi dari model konvensional yang kaku (*hardcoded Day 1, Day 2, Day 3*) menjadi **Sistem Presensi Berbasis Sesi Dinamis (*Session-Driven Dynamic Attendance*)**. 

### Mengapa Berbasis Sesi Dinamis?
1. **Fleksibilitas Tanpa Batas:** Panitia memiliki kebebasan penuh membuat sesi apa pun—misalnya *Presensi Masuk Pagi*, *Presensi Kepulangan Sore*, *Sesi Gladi Bersih*, *Presensi Malam Inagurasi*, atau *Sesi Tambahan Hari ke-4*—tanpa perlu mengubah kode sumber (*codebase*) frontend maupun struktur database.
2. **Konsep Sesi Aktif (*Single Active Gate*):** Pada satu kurun waktu, terdapat satu sesi yang ditandai sebagai `isActive = true`. Sesi aktif inilah yang menjadi acuan gerbang kampus:
   - Mengatur apakah gerbang berstatus **Kedatangan (`CHECK_IN`)** atau **Kepulangan (`CHECK_OUT`)**.
   - Menjadi generator token QR dinamis pada layar proyektor gerbang utama.
   - Menentukan reward XP yang akan didapatkan mahasiswa setelah memindai.
3. **Anti-Titip Absen & Keamanan Berlapis:** Token QR pada proyektor menggunakan salt waktu (*rotating salt*) yang diperbarui berkala dan diproteksi dari duplikasi scan (*one scan per student per session*).

---

## 2. Arsitektur Database (PostgreSQL / Drizzle ORM)

### 2.1. Tabel Sesi Presensi (`attendance_sessions`)
Menyimpan konfigurasi seluruh sesi presensi yang dibuat oleh panitia.

```sql
CREATE TABLE "attendance_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(150) NOT NULL,
  "description" text,
  "type" varchar(20) NOT NULL DEFAULT 'CHECK_IN', -- 'CHECK_IN' | 'CHECK_OUT'
  "is_active" boolean NOT NULL DEFAULT false,     -- Gerbang aktif saat ini
  "qr_token" varchar(100) NOT NULL,              -- Base token QR resmi
  "xp_reward" integer NOT NULL DEFAULT 100,      -- Reward XP per scan
  "allow_late" boolean NOT NULL DEFAULT true,    -- Menerima keterlambatan
  "late_time" varchar(10) DEFAULT '07:30',       -- Ambang jam keterlambatan (HH:mm)
  "start_time" varchar(10) DEFAULT '07:00',      -- Jam mulai sesi
  "end_time" varchar(10) DEFAULT '08:30',        -- Jam akhir sesi
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
```

### 2.2. Tabel Catatan Presensi Mahasiswa (`attendances`)
Menyimpan riwayat presensi individual mahasiswa dengan referensi ke sesi terkait.

```sql
CREATE TABLE "attendances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "participant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "session_id" uuid REFERENCES "attendance_sessions"("id") ON DELETE SET NULL,
  "day" integer NOT NULL DEFAULT 1,
  "date" varchar(20) NOT NULL,
  "check_in_at" timestamp with time zone,
  "check_in_status" attendance_status DEFAULT 'ON_TIME', -- 'ON_TIME' | 'LATE' | 'ABSENT'
  "check_in_qr_token" varchar(100),
  "check_out_at" timestamp with time zone,
  "check_out_qr_token" varchar(100),
  "xp_awarded" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Index pencarian cepat presensi per sesi dan peserta
CREATE INDEX "idx_attendances_session_participant" ON "attendances" ("session_id", "participant_id");
```

### 2.3. Integrasi Gamifikasi & Transaksi Poin (`score_transactions`)
Setiap kali mahasiswa berhasil melakukan presensi masuk atau pulang:
- Record baru dicatat pada `score_transactions` dengan `sourceType = 'BONUS'`.
- Poin XP ditambahkan ke akumulasi tim/kelompok mahasiswa.
- Event WebSocket dipancarkan secara instan (`ATTENDANCE_CHECK_IN` / `ATTENDANCE_CHECK_OUT`) untuk memperbarui papan peringkat (*leaderboard*) secara realtime.

---

## 3. Spesifikasi REST API Presensi

Base URL: `http://localhost:3001/api/attendance`

| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/active-session` | Publik / User | Mendapatkan sesi presensi yang sedang dibuka panitia saat ini. |
| `GET` | `/sessions` | Admin | Menampilkan daftar seluruh sesi presensi yang tersimpan. |
| `POST` | `/sessions` | Admin | Membuat sesi presensi baru. |
| `PUT` | `/sessions/:id/activate` | Admin | Mengaktifkan sesi target dan otomatis menonaktifkan sesi lain. |
| `PUT` | `/sessions/:id/deactivate` | Admin | Menutup/menonaktifkan gerbang sesi presensi. |
| `PUT` | `/sessions/:id` | Admin | Memperbarui informasi sesi (judul, jam, batas telat, reward XP). |
| `DELETE`| `/sessions/:id` | Admin | Menghapus sesi presensi. |
| `POST` | `/scan` | Peserta / Mahasiswa | Universal scan QR gerbang (Check-In / Check-Out otomatis). |
| `GET` | `/recap` | Admin | Mengambil rekap status presensi seluruh mahasiswa (filter `sessionId`). |
| `POST` | `/batch-check-in` | Admin | Presensi manual massal untuk mahasiswa terpilih. |
| `POST` | `/batch-check-out`| Admin | Check-out kepulangan massal untuk mahasiswa terpilih. |
| `POST` | `/batch-reset` | Admin | Mereset status presensi mahasiswa terpilih pada sesi aktif. |

---

## 4. Alur Kerja Logika Presensi (Flow Logic)

```
                     ┌──────────────────────────────┐
                     │   PANITIA / ADMIN GERBANG    │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                [ Pilih Sesi: "Presensi Masuk Pagi" ]
                                    │
                                    ▼
               [ PUT /api/attendance/sessions/:id/activate ]
                                    │
                        isActive = true (Lainnya false)
                                    │
                                    ▼
                [ Buka Proyektor Gerbang di Layar Utama ]
               Menampilkan QR Code Dinamis (+ Salt 5 Menit)
                                    │
  ┌──────────────────────────────────┴─────────────────────────────────┐
  │                                                                    │
  ▼                                                                    ▼
 [ MAHASISWA A: SCAN TEPAT WAKTU ]                    [ MAHASISWA B: SCAN SUDAH TELAT ]
 - Jam: 07:15 WIB (sebelum 07:30)                     - Jam: 07:45 WIB (lewat 07:30)
 - POST /api/attendance/scan                          - POST /api/attendance/scan
   Status: 'ON_TIME'                                    Status: 'LATE'
   XP: +100 XP (Penuh 100%)                             XP: +50 XP (Separuh / 50% Poin)
   Catatan: "Tepat Waktu"                               Catatan: "Terlambat"
  │                                                    │
  └──────────────────────────────────┬─────────────────┘
                                     │
                                     ▼
            [ Duplikasi Scan Ditolak: ALREADY_ATTENDED ]
            Mahasiswa tidak bisa memindai ulang sesi yang sama.
                                     │
                                     ▼
            [ Panitia Mengubah Sesi ke "Kepulangan Sore" ]
                         isActive = true
                                     │
                                     ▼
            [ MAHASISWA SCAN CHECK-OUT SORE ]
            - POST /api/attendance/scan
            - Tipe: 'CHECK_OUT'
            - Reward: +50 XP Kepulangan
```

---

## 5. API Universal Tambah Poin & XP (`POST /api/scores/award`)

Tersedia endpoint yang **sangat fleksibel dan reusable** untuk menambahkan poin/XP mahasiswa dari modul manapun (Mini-Game, Scanner Pos Booth, Presensi, maupun Script/Curl):

### Endpoint:
`POST http://localhost:3001/api/scores/award` (atau alias `POST /api/scores/add-xp`)

### Request Body:
```json
{
  "participantId": "peserta_1",         // Bisa berupa UUID atau NIM/Username
  "amount": 50,                         // Jumlah XP (bilangan bulat positif/negatif)
  "reason": "Menyelesaikan Pos Booth",  // Alasan / deskripsi aktivitas
  "sourceType": "GAME"                  // 'GAME' | 'BONUS' | 'ACHIEVEMENT' (default: 'BONUS')
}
```

### Response:
```json
{
  "success": true,
  "message": "Berhasil menambahkan +50 XP ke Ahmad Dahlan!",
  "data": {
    "transactionId": "a617b05a-7571-4590-90f3-e4afac304829",
    "participantId": "d278451e-26ed-463d-8f3b-3a98c7b0b7c1",
    "participantName": "Ahmad Dahlan",
    "username": "peserta_1",
    "teamId": "c645e2c9-723e-4643-8794-a06231fff512",
    "amount": 50,
    "totalXp": 387,
    "sourceType": "GAME",
    "reason": "Menyelesaikan Pos Booth"
  }
}
```

### Keunggulan Endpoint Reusable Ini:
1. **Menerima UUID maupun NIM/Username:** Tidak perlu konversi manual id di frontend.
2. **Auto-Detect Regu/Kelompok:** Otomatis mencari ID regu mahasiswa untuk pembaharuan skor tim.
3. **Real-Time WebSocket Sync:** Otomatis memicu siaran event `SCORE_SUBMITTED` & `XP_AWARDED` sehingga leaderboard dan layar proyektor langsung terupdate tanpa refresh.
4. **Auth Opsional:** Dapat dipanggil dengan Bearer Token ataupun langsung via sistem internal.

---

## 6. Panduan Pengoperasian

### 6.1. Bagi Panitia & Admin (`http://localhost:3002/attendance`)
1. **Memeriksa Status Gerbang:**
   - Di bagian atas halaman presensi terdapat **Active Session Command Center**.
   - Terlihat status apakah gerbang sedang terbuka atau tertutup, serta jenis sesinya (*Kedatangan* atau *Kepulangan*).
2. **Mengaktifkan Sesi:**
   - Klik tombol **"Kelola Sesi"** untuk melihat daftar sesi atau membuat sesi baru via template instan (*Check-In Masuk Pagi* atau *Check-Out Kepulangan Sore*).
   - Klik **"Aktifkan"** pada sesi yang ingin dibuka. Sistem secara cerdas akan menutup sesi sebelumnya.
3. **Memproyeksikan QR ke Layar Gerbang:**
   - Klik tombol **"Buka Proyektor Gerbang"**.
   - Modal proyektor fullscreen akan memancarkan kode QR dinamis dengan timestamp rotasi 5 menit.
4. **Monitoring & Rekap Data Realtime:**
   - Rekapitulasi dapat difilter per sesi.
   - Tabel menampilkan daftar mahasiswa, NIM, waktu kedatangan, waktu kepulangan, status tepat waktu/terlambat, dan total perolehan XP.
   - Jika ada mahasiswa yang tidak membawa ponsel atau kameranya rusak, panitia dapat memilih mahasiswa tersebut dan menekan tombol **"Manual Check-In"**.

### 5.2. Bagi Mahasiswa Baru (`http://localhost:3000/attendance`)
1. **Melihat Sesi Berjalan:**
   - Mahasiswa membuka tab **Presensi** di ponsel pintar.
   - Banner secara otomatis menampilkan sesi yang sedang dibuka oleh panitia lengkap dengan informasi batas jam dan reward XP.
2. **Memindai Kode QR:**
   - Mahasiswa menekan tombol besar **"PINDAI QR GERBANG KEDATANGAN"** atau **"PINDAI QR GERBANG KEPULANGAN"**.
   - Kamera memindai kode pada layar proyektor gerbang.
3. **Konfirmasi & Riwayat:**
   - Setelah scan berhasil, animasi kembang api (*confetti*) dan efek suara RPG muncul.
   - XP bertambah secara otomatis ke profil mahasiswa dan papan skor kelompoknya.
   - Status terverifikasi dan riwayat presensi disimpan rapi di bagian bawah halaman.

---

## 6. Penanganan Masalah (*Troubleshooting*)

| Gejala Masalah | Penyebab Umum | Solusi |
| :--- | :--- | :--- |
| `NO_ACTIVE_SESSION` saat scan | Panitia belum mengaktifkan sesi presensi di dashboard admin. | Panitia masuk ke `/attendance` di admin dan klik tombol *Buka Gerbang Presensi*. |
| `ALREADY_ATTENDED` | Mahasiswa sudah melakukan presensi pada sesi tersebut. | Sistem mencegah dobel scan. Jika memang salah input, panitia dapat menggunakan *Batch Reset* di admin. |
| `INVALID_QR_TOKEN` | Mahasiswa memindai QR yang salah (misal QR pos lantai alih-alih gerbang). | Arahkan mahasiswa memindai QR resmi yang terpampang di proyektor gerbang kampus. |
| Mahasiswa tidak ada kuota / offline | Perangkat kehilangan sinyal di gerbang. | Frontend memiliki *offline local verification fallback* yang menyimpan catatan presensi lokal sementara hingga koneksi pulih. |

---

*Dokumentasi ini disahkan untuk implementasi teknis PKKMB UNU Yogyakarta 2026.*
