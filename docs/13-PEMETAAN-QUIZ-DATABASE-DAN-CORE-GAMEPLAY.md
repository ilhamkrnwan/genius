# 13. Pemetaan Database Kuis (quiz_database.csv) ke Core Gameplay PKKMB GENIUS UNU 2026

Dokumen ini merupakan analisis dan rancangan integrasi resmi data pertanyaan dari file `quiz_database.csv` ke dalam arsitektur sistem permainan **GENIUS UNU 2026**, mencakup keselarasan antarmuka **Admin**, **User (Mahasiswa Baru)**, dan **Buddy (Fasilitator Regu)** sebelum proses *seed database* dijalankan.

---

## 1. Ringkasan Eksekutif & Struktur Soal

Berdasarkan analisis berkas `quiz_database.csv`, kompetisi eksplorasi kampus terdiri dari **6 Lantai**, **9 Pos Pertanyaan Resmi**, dan total bobot **100 Poin per Pos** (Total 900 Poin maksimal untuk seluruh pos).

### Distribusi Pos & Lantai:
* **Lantai 1:** Pos 1 (Anti Korupsi dan Terorisme) — 8 Soal
* **Lantai 2:** 
  * Pos 2 (Leadership) — 5 Pasang Kartu (10 Kartu)
  * Pos 6 (Media Sosial dan Komunikasi) — 8 Soal
* **Lantai 3:** Pos 3 (Profil Pelajar Pancasila) — 5 Pernyataan Evaluatif
* **Lantai 4:** 
  * Pos 4 (Anti Narkoba) — 5 Kata Teka-Teki Silang (TTS)
  * Pos 9 (Ingat Aku - Teks Gambar Blur & 3 Tokoh NU) — 5 Soal
  
* **Lantai 5:** Pos 5 (Anti Plagiarisme) — 5 Soal Tebak Istilah (Riddle)
* **Lantai 6:** 
  * Pos 7 (Menebak Gambar / Suara) — 5 Soal
  * Pos 8 (Ingat Aku - Tebak Posisi Lantai Gedung) — 5 Soal

---

## 2. Matriks Keselarasan: Bentuk Pertanyaan vs Tipe Game Codebase

Berikut adalah pemetaan setiap pos di `quiz_database.csv` terhadap komponen mini-game, tipe backend enum, dan alur penskoran:

| Pos & Lantai | Tema & Materi CSV | Bentuk Pertanyaan CSV | Tipe Game Frontend (`MiniGameContainer`) | Komponen Vue User | Enum Backend (`schema.ts`) | Struktur Data & Penskoran |
|:---:|:---|:---|:---|:---|:---|:---|
| **Pos 1**<br>*(Lantai 1)* | **Anti Korupsi dan Terorisme**<br>Pengelolaan dana, gratifikasi, intoleransi, whistleblowing. | **Pilihan Ganda**<br>(8 Kasus Dilema Etika) | `kuis` / `kuis_cepat` | [`KuisCepatGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/KuisCepatGame.vue) | `QUIZ` | 8 Soal, Opsi A–E, kunci jawaban deterministik.<br>Skor: `[13, 12, 13, 12, 13, 12, 13, 12]` = **100 Pts** |
| **Pos 2**<br>*(Lantai 2)* | **Leadership**<br>Integritas, Delegasi, Ghosting Anggota, Visioner, Problem Solving Listrik Padam. | **Memorize**<br>(5 Pasang Kartu Konsep & Solusi) | `memory_match` | [`MemoryMatchGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/MemoryMatchGame.vue) | `MEMORY` | Grid 10 kartu (5 pasang). Memasangkan konsep kepemimpinan dengan tindakan solutifnya.<br>Skor: `[15, 20, 25, 15, 25]` = **100 Pts** |
| **Pos 3**<br>*(Lantai 3)* | **Profil Pelajar Pancasila**<br>Kemandirian, Berkebhinekaan Global, Akhlak Beragama, Nalar Kritis, Gotong Royong. | **Benar/Salah**<br>(5 Pernyataan Kritis) | `benar_salah` | [`BenarSalahGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/BenarSalahGame.vue) | `RAPID_ANSWER` | 5 Pernyataan evaluasi logika. Tombol Benar / Salah dengan feedback penjelas nilai Aswaja.<br>Skor: `[15, 20, 20, 20, 25]` = **100 Pts** |
| **Pos 4**<br>*(Lantai 4)* | **Anti Narkoba**<br>Zat adiktif, adiksi, pola hidup bebas, panti rehab, menolak ajakan. | **Teka-teki silang (TTS)**<br>(5 Kata Mendatar/Menurun) | `tts` | [`TtsGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TtsGame.vue) | `PUZZLE` | Grid silang dengan 5 kata kunci: `NARKOBA`, `KETAGIHAN`, `BEBAS`, `REHAB`, `TOLAK`.<br>Skor: 5 kata x 20 = **100 Pts** |
| **Pos 5**<br>*(Lantai 5)* | **Anti Plagiarisme**<br>Definisi plagiat, kutipan sah, daftar pustaka, integritas, autoplagiasi. | **Tebak Kata**<br>(5 Teka-Teki "Siapakah Aku?") | `tebak_kata` | [`TebakKataGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakKataGame.vue) | `WORD_GAME` | Riddle definisi kata dengan anagram huruf: `PLAGIAT`, `KUTIPAN`, `REFERENSI`, `INTEGRITAS AKADEMIK`, `AUTOPLAGIARISME`.<br>Skor: `[10, 20, 20, 25, 25]` = **100 Pts** |
| **Pos 6**<br>*(Lantai 2)* | **Media Sosial & Komunikasi**<br>Cyberbullying, jejak digital, cek fakta, netiket, konkret, privasi, personal branding, klarifikasi. | **Jawaban Singkat**<br>(8 Pertanyaan Terminologi) | `kuis` / `kuis_cepat` *(Diadaptasi jadi Opsi)* | [`KuisCepatGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/KuisCepatGame.vue) | `QUIZ` | 8 Soal pilihan ganda istilah digital persis dari CSV untuk mencegah kegagalan grading akibat typo pengetikan di HP.<br>Skor: `[13, 12, 13, 12, 13, 12, 13, 12]` = **100 Pts** |
| **Pos 7**<br>*(Lantai 6)* | **Fun Pos: Observasi Media**<br>Tebak lagu MBG, Jokowi Pria Solo, Prabowo Nyawit, monyet, Sapi mohhh. | **Jawaban Singkat / Tebak Gambar & Audio** | `tebak_gambar` | [`TebakGambarGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakGambarGame.vue) | `IMAGE_GUESS` | 5 Petunjuk multimedia dengan Google Drive Iframe preview persis dari CSV.<br>Skor: 5 soal x 20 = **100 Pts** |
| **Pos 8**<br>*(Lantai 6)* | **Ingat Aku (Tebak Posisi)**<br>Ada di lantai berapakah aku? (Lantai 2 amphiteater, Lantai 4, Lantai 1, Lantai 4, Lantai 3). | **Tebak Lantai Fasilitas**<br>(5 Foto Ruangan UNU) | `tebak_posisi` | [`TebakPosisiGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakPosisiGame.vue) | `LOGIC` / `IMAGE_GUESS` | Menampilkan foto fasilitas kampus via Google Drive Iframe preview, mahasiswa memilih nomor lantai.<br>Skor: 5 ronde x 20 = **100 Pts** |
| **Pos 9**<br>*(Lantai 4)* | **Ingat Aku (Teks Blur & Tokoh NU)**<br>Teks dinding kampus diblur + 3 Ulama Muassis NU (1. KH. M Hasyim Asyaari, 2. KH. Bisri Syansuri, 3. KH. Abdul Wahab Chasbullah). | **Tebak Tulisan Gambar Blur**<br>(5 Soal Observasi) | `tebak_gambar` | [`TebakGambarGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakGambarGame.vue) | `IMAGE_GUESS` | Menampilkan visual teks samar fasilitas kampus & potret pendiri NU via Google Drive Iframe preview dengan pilihan teks persis dari CSV.<br>Skor: 5 soal x 20 = **100 Pts** |

---

## 3. Evaluasi Kesiapan 3 Sisi: Admin, User, dan Buddy

### A. Sisi Admin (`frontend/admin`)
1. **Katalog & Master Game ([`games.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/admin/app/pages/games.vue)):**
   * Terdapat fitur `SINKRONKAN DEFAULT GAME` yang memanggil `POST /api/games/sync-defaults`.
   * Di file backend [backend/src/routes/games.ts](file:///home/fauzan/Projects/genius/genius-unu/backend/src/routes/games.ts#L207-L360), definisi Pos 1 sampai Pos 9 sudah mulai dituliskan.
   * **Yang Perlu Diselaraskan:** Parameter skor dan metadata di `sync-defaults` harus dipastikan sama persis dengan tabel bobot di atas agar game engine dan live monitoring admin membaca bobot yang seragam.
2. **Bank Soal ([`questions.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/admin/app/pages/questions.vue)):**
   * Menampilkan data soal dari `GET /api/questions`.
   * Saat ini tabel `questions` di PostgreSQL baru berisi 5 data *dummy*. Seluruh 47 pertanyaan/pernyataan dari Pos 1 sampai Pos 9 harus di-seed ke dalam tabel `questions` ini agar admin bisa memonitor, mengedit, atau mengganti kunci jawaban secara dinamis dari web dashboard.
3. **Misi Pos Kampus ([`missions.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/admin/app/pages/missions.vue)):**
   * Menampilkan pemetaan misi terhadap lokasi pos di gedung.
   * Data misi harus mengikat tepat ke 9 pos resmi ini sesuai lantai 1 sampai 6.

### B. Sisi Buddy ([`BuddyPosController.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/admin/app/components/buddy/BuddyPosController.vue))
1. **Fallback List:**
   * Di baris 224–243 `BuddyPosController.vue`, fallback statis saat ini masih berupa 18 booth teoritis lama (`b1-a` s/d `b9-b`).
   * **Penyesuaian Wajib:** Daftar fallback harus disesuaikan menjadi **9 Pos Resmi** (`POS-L1-1` s/d `POS-L6-8`) agar ketika offline atau data server belum termuat, dropdown Buddy langsung menampilkan pos nyata.
2. **Aktivasi Server Sesi:**
   * Buddy mengaktifkan sesi pos untuk regunya (`/api/game-sessions/create` & `/start`) dengan batas waktu server (preset 10m / 12m / 15m).
   * Sinkronisasi nama pos di controller buddy akan otomatis terisi saat endpoint `/api/missions` menyajikan 9 pos resmi.

### C. Sisi User (`frontend/user`)
1. **Container Mini Game ([`MiniGameContainer.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/MiniGameContainer.vue)):**
   * Sudah mendukung seluruh 8 tipe game: `kuis_cepat`, `memory_match`, `benar_salah`, `tts`, `tebak_kata`, `tebak_posisi`, `tebak_gambar`, dan `kuis_balapan`.
2. **Adapter Sesi Dinamis ([`game-adapter.ts`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/lib/game-adapter.ts)):**
   * Sudah memiliki peta alias resmi:
     * `POS-L1-1` $\rightarrow$ `booth-1a`
     * `POS-L2-2` $\rightarrow$ `booth-2a`
     * `POS-L2-6` $\rightarrow$ `booth-2b`
     * `POS-L3-3` $\rightarrow$ `booth-3a`
     * `POS-L4-4` $\rightarrow$ `booth-4a`
     * `POS-L4-9` $\rightarrow$ `booth-4b`
     * `POS-L5-5` $\rightarrow$ `booth-5a`
     * `POS-L6-7` $\rightarrow$ `booth-6a`
     * `POS-L6-8` $\rightarrow$ `booth-6b`
3. **Data Lokal & Fallback ([`genius2026QuizData.ts`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/data/genius2026QuizData.ts)):**
   * Seluruh pertanyaan untuk 9 Pos ini telah ditranslasikan dengan sangat rapi dan siap dimainkan baik secara *offline (local-first)* maupun terhubung ke sesi live server PostgreSQL.

---

## 4. Status Eksekusi Seeding & Integrasi (Selesai 100%)

1. **Sinkronisasi Skema Seed Backend (`backend/scripts/seed_official_quiz.ts`):** ✅ Selesai
   * Tabel `questions` telah di-seed dengan 51 butir soal persis dari CSV (tanpa paraphrase).
   * Game Engine di tabel `games` telah terhubung ke Misi (`missions`) dan Lokasi 9 Pos (`locations` Lantai 1–6).
2. **Google Drive Iframe Preview (Pos 7, Pos 8, Pos 9):** ✅ Selesai
   * Menggunakan format URL embed `https://drive.google.com/file/d/${id}/preview` via elemen `<iframe>` langsung di [`TebakGambarGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakGambarGame.vue) dan [`TebakPosisiGame.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/components/minigames/TebakPosisiGame.vue).
   * Link folder rujukan TTS dikecualikan dari iframe maba.
3. **Penyelarasan Fallback `BuddyPosController.vue` & `genius2026QuizData.ts`:** ✅ Selesai
   * Fallback `BuddyPosController.vue` telah menggunakan 9 Pos Resmi (`POS-L1-1` s/d `POS-L6-8`).
   * Fallback offline [`genius2026QuizData.ts`](file:///home/fauzan/Projects/genius/genius-unu/frontend/user/src/data/genius2026QuizData.ts) telah 100% cocok kata per kata dengan CSV.
4. **CRUD Admin Dashboard (`frontend/admin`):** ✅ Selesai
   * Admin memiliki kontrol penuh atas bank soal melalui menu Bank Soal ([`questions.vue`](file:///home/fauzan/Projects/genius/genius-unu/frontend/admin/app/pages/questions.vue)) dengan pencarian, filter kategori resmi, pengubahan bobot skor, kunci jawaban, dan ID Google Drive.
