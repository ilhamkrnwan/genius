# 📋 BACKLOG & HANDOFF NOTES — GENIUS UNU 2026

Dokumen ini berisi catatan teknis dan daftar pekerjaan yang perlu diselesaikan oleh tim/anggota yang bertugas.
Jangan hapus catatan ini sampai item terkait selesai diimplementasi dan di-merge ke main branch.

---

## 🔐 [BACKEND] Role `ORMAWA_PIC` & Autentikasi Dashboard Scanner

**PIC Teknis:** Tim Backend (Fauzan / yang bertugas di backend)
**Status:** ⏳ PENDING — Menunggu implementasi

### Latar Belakang
Berdasarkan hasil rapat (07 Sept 2026), mekanisme scan Ormawa Expo **diubah**:
- ❌ **LAMA:** Mahasiswa Baru (Maba) scan QR dari stan Ormawa.
- ✅ **BARU:** PIC/Admin Ormawa scan QR milik Maba (berisi NIM). Maba hanya perlu menunjukkan layar HP mereka.

### Yang Perlu Dikerjakan Backend

#### 1. Tambah Role `ORMAWA_PIC` ke Skema Database
Di berkas [`backend/src/db/schema.ts`](./backend/src/db/schema.ts), ubah enum `userRoleEnum`:
```typescript
// SEBELUM:
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "BUDDY", "PARTICIPANT"]);

// SESUDAH:
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "BUDDY", "PARTICIPANT", "ORMAWA_PIC"]);
```
Kemudian jalankan migrasi: `bun run db:push` atau `drizzle-kit push`.

#### 2. Tambah Kolom `logoUrl` & `picUserId` ke Tabel `ormawaBooths`
Di [`backend/src/db/schema.ts`](./backend/src/db/schema.ts), tambahkan dua kolom ke tabel `ormawaBooths`:
```typescript
logoUrl: text("logo_url"),               // URL logo Ormawa/UKM untuk ditampilkan di frontend
picUserId: uuid("pic_user_id").references(() => users.id),  // FK ke akun ORMAWA_PIC yang bertugas di stan ini
```

#### 3. Buat Endpoint Baru: `POST /api/ormawa/scan-maba`
Endpoint ini dipanggil oleh akun `ORMAWA_PIC` melalui Dashboard Scanner Admin.
- **Auth:** Hanya role `ORMAWA_PIC` (dan `ADMIN`) yang bisa memanggil endpoint ini.
- **Request Body:** `{ mabaNim: string }` atau `{ mabaQrToken: string }` (QR token berisi NIM maba)
- **Logic:**
  1. Cari user Maba berdasarkan `username` (NIM).
  2. Tentukan booth ID berdasarkan `picUserId` dari user yang sedang login (`user.userId`).
  3. Cek duplikat scan (`ormawaScans` tabel — unique constraint `participantId + boothId`).
  4. Cek capping (maksimal 10 stan per Maba yang memberikan XP).
  5. Insert ke `ormawaScans`, tambah `scoreTransactions` jika berhak XP.
  6. Broadcast `ORMAWA_VISIT_RECORDED` ke WebSocket admin.
- **Response:** `{ success, message, data: { maba, xpEarned, totalScanned, isCapped } }`

#### 4. Buat Akun Seed untuk PIC Ormawa
Di [`backend/src/db/seed.ts`](./backend/src/db/seed.ts), tambahkan contoh akun PIC per stan:
```typescript
// Contoh: 1 akun ORMAWA_PIC per stan (username = kode stan, password = genius2026)
{ username: "pic-pagar-nusa", fullName: "PIC Pagar Nusa", role: "ORMAWA_PIC", ... }
```
Dan hubungkan `picUserId` di tabel `ormawaBooths`.

#### 5. Update Auth Middleware
Pastikan `frontend/admin` bisa login dengan role `ORMAWA_PIC` dan diarahkan langsung ke halaman `/ormawa/scan`.

---

## 📱 [FRONTEND USER] QR Code Generator untuk Maba

**Status:** ✅ SELESAI (lihat `OrmawaExpoView.vue`)

QR Code Maba sudah ditampilkan di halaman `/ormawa` berisi NIM mahasiswa. Format QR: `GENIUS-MABA-{NIM}`.

---

## 🖥️ [FRONTEND ADMIN] Dashboard Scanner PIC Ormawa

**Status:** ✅ SELESAI (lihat `frontend/admin/pages/ormawa/scan.vue`)

Dashboard scanner sudah dibuat di halaman `/ormawa/scan`. Namun saat ini menggunakan endpoint placeholder karena endpoint `POST /api/ormawa/scan-maba` belum ada.

**Catatan untuk Backend:** Setelah endpoint `POST /api/ormawa/scan-maba` selesai, update URL fetch di `pages/ormawa/scan.vue` dari `'/ormawa/scan'` menjadi `'/ormawa/scan-maba'` dan sesuaikan payload `{ qrToken }` → `{ mabaNim }` atau `{ mabaQrToken }`.
