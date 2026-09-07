# Brainstorming: Menghubungkan Game User ke Admin Dashboard
## Tujuan

Menyatukan tiga bagian sistem:

1. Admin Dashboard membuat, mengatur, mengaktifkan, dan memantau game.
2. Backend menjadi sumber kebenaran untuk game, soal, sesi, waktu, validasi, dan skor.
3. Frontend User mengambil game aktif, menjalankannya, dan mengirim jawaban atau hasil ke backend.

Alur yang diinginkan:

Admin membuat game -> Backend menyimpan game -> Admin menempatkan game ke mission/booth -> User membuka booth -> Backend membuat session -> User bermain -> Backend menghitung skor -> Admin memantau session dan skor.

## Temuan Codebase Saat Ini

### Fondasi yang sudah tersedia

- frontend/admin/pages/games.vue sudah memiliki katalog game, create/edit, toggle status, delete, dan sync default games.
- frontend/admin/pages/questions.vue sudah memiliki daftar soal dan form create/edit/delete.
- Backend sudah memiliki route untuk games, game-sessions, questions, scores, missions, locations, leaderboard, dan monitoring.
- Database sudah memiliki tabel games, missions, game_sessions, questions, score_transactions, dan audit_logs.
- User frontend sudah memiliki MiniGameContainer.vue dan game component untuk TTS, Tebak Kata, Tebak Posisi, Tebak Gambar, Kuis Balapan, Memory Match, Kuis Cepat, dan Benar/Salah.
- Shared package sudah memiliki tipe game lama berbasis booth.

### Gap utama

#### Dua model game belum disatukan

Frontend memakai nama seperti tts, tebak_kata, memory_match, kuis_cepat, dan benar_salah. Backend memakai nama seperti QUIZ, PUZZLE, MEMORY, REACTION, IMAGE_GUESS, TEAM_CHALLENGE, dan EXPLORATION.

Harus ada satu mapping resmi. Kalau tidak, admin dapat mengaktifkan game yang tidak dapat dirender oleh MiniGameContainer.

#### Config game terlalu bebas

games.config berupa JSONB fleksibel. Ini baik untuk eksperimen, tetapi frontend membutuhkan kontrak berbeda untuk setiap tipe game: quiz membutuhkan soal, memory membutuhkan pasangan kartu, image guess membutuhkan gambar dan pilihan, dan seterusnya.

#### Admin masih memiliki fallback mock

frontend/admin/composables/useApi.ts mencoba live backend lalu fallback ke mockDb. Ini dapat menyamarkan kegagalan backend. Fallback sebaiknya hanya untuk development, bukan production.

#### User API belum lengkap

frontend/user/src/lib/api.ts baru memiliki login, floors, leaderboard, dan submit score sederhana. Belum ada client khusus untuk mission aktif, detail game, pembuatan session, submit jawaban, dan hasil final server.

#### Scoring harus server-authoritative

Frontend tidak boleh menjadi sumber kebenaran untuk jawaban benar, skor, XP, status completed, replay rule, waktu mulai, dan waktu selesai. Endpoint skor bebas juga berisiko dimanipulasi.

## Rekomendasi Arsitektur

### 1. Game Definition

Template mekanisme game yang dapat digunakan berkali-kali. Dikelola pada halaman Admin Games.

Field penting: id, name, canonical type, status, description, instructions, config, question bank category, minPlayers, dan maxPlayers.

### 2. Mission / Booth Assignment

Game definition ditempatkan ke aktivitas tertentu. User tidak memilih game dari seluruh katalog.

Field penting: mission id, location id, stage id, game id, order, isRequired, timeLimit, dan status.

Admin harus dapat melihat relasi Mission -> Location -> Floor -> Game -> Status.

### 3. Game Session

Satu percobaan permainan user atau team. Session menyimpan game, mission, team, lokasi, status, waktu server, result, dan total score.

Status yang disarankan: PENDING, READY, ACTIVE, PAUSED, COMPLETED, EXPIRED, dan CANCELLED.

## Keputusan Desain yang Disarankan

### Canonical game type

Gunakan tipe backend sebagai canonical type dan buat mapping renderer pada shared package.

Mapping awal:

| Backend type | User renderer |
| --- | --- |
| QUIZ | KuisCepatGame atau KuisBalapanGame |
| MEMORY | MemoryMatchGame |
| IMAGE_GUESS | TebakGambarGame |
| PUZZLE | TebakKataGame atau renderer puzzle baru |
| REACTION | renderer reaction baru |
| TEAM_CHALLENGE | renderer team challenge baru |
| EXPLORATION | renderer incubation/exploration baru |

Mapping harus berada di satu file shared, bukan disalin di banyak component.

### Pisahkan engine dari content

Admin menyimpan content dan config. Frontend memilih engine berdasarkan type. Admin tidak perlu membuat component Vue baru untuk setiap pertanyaan.

### Pisahkan payload admin dan payload user

Admin boleh menerima correct answer dan explanation. User hanya menerima pertanyaan dan pilihan tanpa jawaban benar. Backend memvalidasi jawaban yang dikirim user.

### Gunakan soft delete

Game yang sudah dipakai oleh mission atau session jangan di-hard-delete. Ubah status menjadi INACTIVE agar histori skor dan audit tetap aman.

## API Contract yang Disarankan

### Admin game definitions

GET /api/games
GET /api/games/:id
POST /api/games
PUT /api/games/:id
PUT /api/games/:id/toggle-status
POST /api/games/sync-defaults
GET /api/games/:id/preview
GET /api/games/:id/usage

### Questions dan content

GET /api/questions
POST /api/questions
PUT /api/questions/:id
DELETE /api/questions/:id
GET /api/games/:id/content
PUT /api/games/:id/content
GET /api/games/:id/questions
POST /api/games/:id/questions
DELETE /api/games/:id/questions/:questionId

### Mission assignment

GET /api/missions
POST /api/missions
PUT /api/missions/:id
PUT /api/missions/:id/activate
PUT /api/missions/:id/deactivate

### User gameplay flow

GET /api/me/missions/available
GET /api/missions/:id/play
POST /api/game-sessions/create
GET /api/game-sessions/:id
POST /api/game-sessions/:id/start
POST /api/game-sessions/:id/answer
POST /api/game-sessions/:id/complete

Tanggung jawabnya:

1. Endpoint play mengembalikan game config yang aman untuk user.
2. Create session mengecek user/team, mission aktif, replay rule, dan lokasi.
3. Start menentukan waktu mulai dari server.
4. Answer memvalidasi jawaban dan menyimpan progress.
5. Complete menghitung hasil final, score transaction, XP, achievement, dan status completed.

### Admin monitoring

GET /api/game-sessions
GET /api/game-sessions/:id
GET /api/monitoring/games
GET /api/monitoring/games/:id
GET /api/leaderboard
GET /api/scores
GET /api/audit-logs

Event realtime yang berguna: GAME_SESSION_CREATED, GAME_SESSION_STARTED, GAME_SESSION_PAUSED, GAME_SESSION_COMPLETED, GAME_SCORE_UPDATED, dan GAME_STATUS_CHANGED. Untuk MVP, polling 5 sampai 10 detik sudah cukup jika realtime belum stabil.

## Payload Gameplay yang Aman

Response user sebaiknya berisi mission, game id, game type, name, instructions, dan config tanpa jawaban benar.

Jangan kirim ke user:

- correctAnswer;
- correctAnswerIndex;
- admin-only notes;
- draft questions;
- formula scoring internal yang tidak diperlukan.

Submit answer cukup mengirim questionId, answer, dan elapsedMs. Backend menentukan benar/salah dan skor.

## Perubahan Frontend yang Dibutuhkan

### User frontend

Tambahkan API method:

- getAvailableMissions()
- getMissionForPlay(missionId)
- createGameSession(missionId)
- startGameSession(sessionId)
- submitGameAnswer(sessionId, payload)
- completeGameSession(sessionId, payload)

Buat gameSessionStore.ts dengan state availableMissions, selectedMission, gameConfig, session, loading, error, dan lastResult.

MiniGameContainer.vue perlu menerima data backend. Buat adapter normalizeGamePayload agar component game lama tetap bisa dipakai selama kontrak baru diperkenalkan.

### Admin frontend

Halaman games.vue perlu membedakan tiga level:

1. Template: nama, tipe, instruksi, parameter, dan status.
2. Content: soal, pasangan kartu, gambar, atau data game.
3. Placement: hubungan game dengan mission, floor, location, dan stage.

Gunakan status:

- Draft: belum bisa dipasang ke mission aktif.
- Active: bisa dipakai mission.
- Inactive: tidak muncul untuk user.
- Assigned: terhubung ke mission.
- Playable: active, assigned, dan content valid.

Sebelum aktivasi, validation checklist harus memeriksa tipe, config, jumlah content, jawaban benar, assignment, location, stage, timer, dan duplicate assignment.

## Flow Admin Ideal

1. Admin membuat game atau memilih template default.
2. Admin memilih canonical type.
3. Admin mengatur instruksi, timer, reward, dan aturan engine.
4. Admin mengisi atau menghubungkan question bank/content.
5. Admin melakukan Preview as User.
6. Admin mengaktifkan game.
7. Admin menghubungkan game ke mission dan booth.
8. Admin mengatur floor, stage, route, dan waktu aktif.
9. Admin melakukan test play dengan akun test.
10. Game tampil kepada user hanya jika statusnya Playable.

Pada halaman Sessions, admin melihat status, game, mission, floor, location, team, buddy, waktu, peserta, skor, dan error. Pause, cancel, reset, dan koreksi skor harus memiliki permission dan audit log.

## MVP Paling Aman

Buat satu vertical slice lengkap menggunakan satu game QUIZ:

1. Backend menyimpan satu game QUIZ.
2. Admin membuat game dan questions.
3. Admin menghubungkan game ke satu mission.
4. User mengambil mission aktif.
5. User membuat session.
6. User memainkan quiz.
7. User mengirim jawaban ke backend.
8. Backend menghitung skor.
9. Admin melihat session selesai dan skor.

Setelah stabil, tambahkan MEMORY, IMAGE_GUESS, PUZZLE, REACTION, lalu TEAM_CHALLENGE.

## Urutan Implementasi untuk Ian

### Phase 1: Contract dan adapter

- Tentukan canonical game type.
- Buat mapping backend type ke user renderer.
- Tambahkan shared types untuk GameDefinition, Mission, GameSession, GameConfig, dan GameResult.
- Samakan format error response.

### Phase 2: User API dan session store

- Tambahkan API client mission/play/session.
- Buat gameSessionStore.ts.
- Ganti satu game dari mockData.ts ke backend.
- Tambahkan loading, locked, expired, empty, dan error state.

### Phase 3: Server-authoritative result

- Kirim jawaban atau result event ke backend.
- Backend memvalidasi dan menghitung skor.
- Frontend hanya menampilkan result dari backend.
- Pastikan refresh tidak memberi reward dua kali.

### Phase 4: Admin live API

- Matikan fallback mock pada environment production.
- Hubungkan games.vue dan questions.vue ke backend.
- Hubungkan mission assignment ke game definition.
- Tampilkan status Playable.

### Phase 5: Monitoring dan QA

- Tampilkan session list dan detail.
- Tes role admin, buddy, dan participant.
- Tes no replay, timer server, dua device, network disconnect, retry, dan beban sekitar 500 user.

## Hal yang Jangan Dilakukan

- Jangan mempercayai score final dari frontend tanpa validasi.
- Jangan mengirim correctAnswer ke user sebelum selesai.
- Jangan membiarkan game aktif tanpa mission/location.
- Jangan hard-delete game yang mempunyai histori.
- Jangan mengandalkan mockDb pada production.
- Jangan mengganti nama game type hanya di satu component.
- Jangan mencampur booth lama dan mission baru tanpa adapter.

## Pertanyaan untuk Diputuskan Tim

1. Game dimainkan individual atau per team?
2. Apakah semua game harus memakai game_sessions?
3. Questions menjadi global question bank atau disimpan langsung di games.config?
4. Apakah replay boleh untuk latihan tetapi completion pertama saja yang memberi XP?
5. Siapa yang boleh pause, cancel, reset, dan koreksi skor?
6. Apakah satu mission hanya boleh memiliki satu game?
7. Apakah satu game definition boleh dipasang ke banyak mission?
8. Apakah floor 7 sampai 9 digunakan?
9. Timer dihitung per user, per team, atau per booth session?
10. Realtime sungguhan atau polling cukup untuk MVP?

## Kesimpulan

Fondasi backend dan admin sudah cukup besar. Fokus integrasi frontend sebaiknya menyatukan:

Game Definition -> Mission Assignment -> User Game Session -> Server Result -> Admin Monitoring.

Prioritas paling penting adalah satu canonical game type, satu API contract, session server-side, payload tanpa jawaban benar, assignment game yang jelas, monitoring session, dan satu vertical slice quiz end-to-end. Setelah alur ini berhasil, game lain dapat ditambahkan sebagai adapter dan content baru tanpa mengubah fondasi koneksi admin-backend-user.

## Implementation Breakdown per Phase

Bagian ini menerjemahkan rencana menjadi pekerjaan yang dapat dikerjakan dan diverifikasi.

### Phase 0 — Baseline dan Branch Preparation

Tujuan: memastikan semua orang bekerja dari kondisi codebase yang sama.

Pekerjaan:

1. Buat atau gunakan branch frontend integration milik Ian.
2. Jalankan user frontend, admin frontend, dan backend secara lokal.
3. Catat port, environment variable API, dan cara login.
4. Uji endpoint health, login, games, questions, missions, dan game-sessions.
5. Dokumentasikan endpoint yang berhasil, gagal, atau masih memakai mock.
6. Pastikan perubahan existing di branch tidak tertimpa.

Area file awal:

- frontend/user/src/lib/api.ts
- frontend/user/src/store/gameStore.ts
- frontend/user/src/components/minigames/MiniGameContainer.vue
- frontend/admin/composables/useApi.ts
- frontend/admin/pages/games.vue
- frontend/admin/pages/questions.vue
- backend/src/routes/games.ts
- backend/src/routes/game-sessions.ts
- backend/src/db/schema.ts

Output: branch siap, tiga service dapat berjalan, dan daftar masalah integrasi terdokumentasi.

Definition of done: anggota tim lain dapat menjalankan tiga service menggunakan instruksi yang sama.

### Phase 1 — Contract, Type, dan Game Adapter

Tujuan: menyamakan bahasa antara database, admin, dan renderer game user.

Pekerjaan:

1. Tetapkan backend game type sebagai canonical type: QUIZ, MEMORY, IMAGE_GUESS, PUZZLE, REACTION, TEAM_CHALLENGE, dan EXPLORATION.
2. Tambahkan shared types untuk GameDefinition, GameConfig, PublicGameConfig, MissionPlayable, GameSession, AnswerSubmission, GameResult, dan PlayableValidation.
3. Pisahkan admin config dari public config agar correctAnswer dan correctAnswerIndex tidak terkirim ke user.
4. Buat satu renderer registry untuk memetakan canonical type ke component Vue.
5. Buat normalizeGamePayload(apiGame) agar response backend dapat dipakai MiniGameContainer.
6. Jika renderer belum tersedia, tampilkan status NOT_IMPLEMENTED, bukan game yang salah.

Mapping awal: QUIZ ke KuisCepatGame, MEMORY ke MemoryMatchGame, IMAGE_GUESS ke TebakGambarGame, PUZZLE ke TebakKataGame atau renderer puzzle baru.

Output: satu fixture QUIZ dari backend berhasil dinormalisasi menjadi props KuisCepatGame.

Definition of done: perubahan nama atau format backend tidak perlu diperbaiki di banyak component karena hanya adapter yang berubah.

Dependency: keputusan tim tentang canonical game type.

Status implementasi: selesai untuk baseline contract. Shared canonical types, renderer mapping, public-question sanitizer, dan compatibility adapter sudah ditambahkan. Gameplay masih memakai komponen lama sampai Phase 2–3 menghubungkannya ke session dan server result.

Status implementasi Phase 2: selesai pada API client, user session store, public mission/play endpoints, dan permission untuk participant membuat session. Endpoint answer/server-authoritative completion masih menjadi pekerjaan Phase 3.

Status implementasi Phase 3: backend sekarang menyimpan answer submission pada session metadata, mencegah duplicate submission berdasarkan submissionId, memakai stored answers saat participant menyelesaikan session, dan membuat completion idempotent. GameEngine juga mengenali tipe database QUIZ. KuisCepatGame dan MiniGameContainer sudah menerima optional serverSessionId; parent view masih perlu memasukkan session lifecycle secara penuh pada langkah integrasi berikutnya.

Status implementasi vertical slice user: BoothDetailView sekarang mencoba memuat mission backend berdasarkan route id, menormalisasi payload menjadi model booth lama, membuat dan memulai game session, lalu meneruskan serverSessionId ke MiniGameContainer. Jika backend mission tidak tersedia atau akun belum memiliki team, UI mempertahankan booth lokal dan menampilkan status/error yang relevan.

Status implementasi Phase 4: admin API fallback sekarang hanya memakai mockDb jika NUXT_PUBLIC_USE_MOCK_API=true. Missions page sudah mengirim field backend yang benar dan menyediakan assignment lokasi, stage, serta game definition. Games page menampilkan indikator PLAYABLE atau NEEDS SETUP berdasarkan status dan content/config dasar. Admin typecheck berhasil.

Phase 4 completion: backend preflight game sekarang menjadi pemeriksaan readiness authoritative. Pemeriksaan mencakup status ACTIVE, konfigurasi, content quiz atau memory, dan assignment ke mission aktif. Aktivasi ulang game yang belum playable ditolak backend dengan alasan yang dapat ditampilkan admin. Games page mengambil hasil preflight per game dan memakai heuristic hanya sebagai fallback saat preflight belum tersedia. Shared, user, backend, dan admin typechecks semuanya lulus.

Phase 5 implementation started: Sessions admin page now consumes the monitoring stats endpoint for operational counters, displays last successful sync and backend monitoring errors, keeps 3-second polling, and adds an explicit EXPIRE action. Backend expire now frees the location, creates an audit log, and broadcasts session/admin events. Backend and admin typechecks pass. Remaining Phase 5 work is runtime QA, permission-flow testing, reconnect behavior, and staged load testing.

Phase 5 regression baseline: backend unit suite includes deterministic duplicate-answer and idempotency coverage, and the QUIZ engine type is covered in the engine switch. The default backend test suite passes with 21 tests. Database-backed quiz evaluation is deferred to runtime integration testing because local PostgreSQL is not running in this environment.

Quiz frontend/server result milestone: the participant quiz now receives server-derived isCorrect and scoreEarned metadata for each answer without exposing correctAnswer. Duplicate submissions return the original answer result, answer progress reports the generated question count, and active session IDs persist in localStorage for refresh recovery. BoothDetailView restores an existing session for the same mission before creating a new one. User and backend typechecks pass, the live API contract returns five sanitized questions, and the backend suite remains 21/21 passing.

Session lifecycle hardening milestone: session creation now rejects duplicate READY/ACTIVE/PAUSED sessions for the same team and mission. Participant and Buddy ownership is enforced for start, complete, answer, and relevant session actions. Buddy pause/cancel/expire actions are restricted to assigned teams, pause/cancel/expire validate allowed state transitions, and answer submission expires sessions from the server timer while freeing the location and writing an audit event. Backend typecheck and the 21-test suite pass.

Timer and recovery milestone: completion now applies the same server timer enforcement as answer submission, including paused-duration accounting, location release, audit logging, and realtime expiration events. The user session store exposes expired/paused states, clears expired session storage, and shows an explicit expired or unavailable session screen instead of rendering a stale game. Backend and user typechecks pass.

Concurrency hardening milestone: game sessions now have a PostgreSQL partial unique index on team and mission for READY/ACTIVE/PAUSED states. The create route maps unique-constraint races to a stable SESSION_ALREADY_ACTIVE response, while completed/expired/cancelled history remains allowed. Schema push completed successfully against the running project database; backend health is 200, typecheck passes, and all 21 backend tests pass.

Completion idempotency milestone: score ledger rows now have a composite uniqueness guard on game session and participant. Concurrent completion attempts cannot duplicate rewards; a unique-constraint race is returned as the existing completed session result. The schema migration completed successfully, backend health remains 200, typecheck passes, and all 21 tests pass.

Lifecycle test milestone: added a reusable session lifecycle contract for valid transitions and paused-time expiry calculation, wired the route handlers to that contract, and added deterministic tests for start/pause/complete/cancel/expire rules plus paused-duration timing. Backend tests now pass 24/24, and backend/user typechecks pass.

API integration milestone: added an opt-in PostgreSQL-backed HTTP integration test covering participant login, mission discovery, sanitized quiz payload, session creation/start, answer submission, duplicate-answer idempotency, completion, and repeated completion. Run it from the backend package with RUN_API_INTEGRATION=true plus integration credential environment variables. The live test passed with 1 test and 21 assertions; default tests remain database-independent at 24/24.

API integration expansion: the opt-in live test now also selects a fresh mission, verifies the database-backed duplicate active-session guard returns SESSION_ALREADY_ACTIVE, then starts and completes the fresh session for cleanup. The live test passes with 33 assertions; the default suite remains 24/24 and backend health is 200.

Lifecycle API coverage expansion: the live integration test now verifies Admin pause, participant/Admin resume, preservation of server start time, paused-duration metadata, and Admin cancellation. The live test passes with 46 assertions; backend default tests remain 24/24 and backend/admin typechecks pass.

RBAC integration milestone: live coverage now verifies participant rejection for cross-team creation attempts, participant rejection for admin-only pause actions, authorized Admin pause/resume/cancel behavior, and cancelled-session detail access. The test passes with 49 assertions. The participant pause gap found by the integration test was fixed with explicit route-level role checks; backend tests remain 24/24 and backend/user/admin typechecks pass.

Timer integration milestone: the live PostgreSQL test now shortens a fresh session timer, verifies answer submission returns SESSION_EXPIRED, confirms the session changes to EXPIRED, and checks that its location is automatically released to AVAILABLE. The live test passes with 58 assertions; backend tests remain 24/24 and backend/user/admin typechecks pass.

Database runtime update: project PostgreSQL is now reachable on host port 5432 after recreating the project database container with the Compose port mapping. Drizzle schema push succeeded and the existing seed completed successfully. Current seeded baseline includes 3 games, 10 active questions, 9 missions, 9 floors, 18 locations, and 5 participants. Backend tests now pass with PostgreSQL available: 21 passed, 0 failed.

### Phase 2 — Backend Public Play API dan User Session Store

Tujuan: user frontend mendapatkan game dari backend melalui session, bukan dari mockData.

Endpoint yang harus stabil:

- GET /api/me/missions/available
- GET /api/missions/:id/play
- POST /api/game-sessions/create
- GET /api/game-sessions/:id
- POST /api/game-sessions/:id/start

Endpoint play harus memeriksa authentication, participant role, mission status, stage/time event, team, game ACTIVE, lokasi/QR requirement, dan no-replay rule.

Tambahkan di frontend/user/src/lib/api.ts:

- getAvailableMissions()
- getMissionForPlay(missionId)
- createGameSession(missionId)
- getGameSession(sessionId)
- startGameSession(sessionId)

Buat gameSessionStore.ts dengan state availableMissions, selectedMission, gameConfig, session, status, loading, error, dan lastResult. Action minimal: loadAvailableMissions, loadMissionForPlay, createSession, startSession, dan clearSession.

Integrasi flow:

1. User membuka mission.
2. Frontend meminta data playable.
3. Frontend menampilkan loading atau alasan locked.
4. Frontend membuat session.
5. Frontend merender game dari response session.
6. Timer memakai serverStartAt, bukan hanya waktu browser.

Output: user dapat membuka satu mission quiz aktif dan memperoleh session dari backend.

Definition of done: refresh tidak membuat session duplikat dan mission inactive tidak dapat dimainkan.

Dependency: Phase 1 dan backend auth/permission.

### Phase 3 — Gameplay Result Server-Authoritative

Tujuan: backend memvalidasi jawaban dan menjadi sumber kebenaran skor.

Untuk MVP, gunakan submit per pertanyaan melalui POST /api/game-sessions/:id/answer.

Payload minimal: questionId, answer, dan elapsedMs. Response dapat berisi isCorrect, scoreEarned, dan progress, tetapi jangan membuka jawaban untuk soal berikutnya.

Pekerjaan backend:

1. Cek session masih ACTIVE.
2. Cek timer server.
3. Validasi question dan jawaban.
4. Simpan submission.
5. Terapkan idempotency dengan sessionId + questionId atau submissionId.
6. Hitung skor dari server.
7. Saat complete, ubah session menjadi COMPLETED atau EXPIRED.
8. Buat score transaction dan reward hanya satu kali.
9. Kembalikan result resmi.

Pekerjaan frontend:

- Tambahkan submitGameAnswer(sessionId, payload).
- Tambahkan completeGameSession(sessionId).
- Pisahkan local UI state dari server state.
- Tampilkan skor final dari backend, bukan hasil hitungan lokal.
- Tangani retry tanpa duplicate reward.

Output: quiz dapat dimainkan sampai selesai dengan skor backend.

Definition of done: request yang diulang tidak menggandakan skor, XP, atau achievement.

Dependency: Phase 2, database session/result, dan scoring engine backend.

### Phase 4 — Admin Live API, Content, dan Mission Placement

Tujuan: admin mengelola game dari template sampai playable.

Pekerjaan pada frontend/admin/pages/games.vue:

1. Gunakan GET /api/games sebagai source utama.
2. Gunakan POST/PUT dan toggle status backend.
3. Tampilkan loading, saving, dan error state yang nyata.
4. Tampilkan mission usage count.
5. Cegah hard delete jika game sudah memiliki histori.

Pekerjaan pada useApi.ts:

- Fallback mock hanya aktif dengan explicit development flag.
- Pada staging/production, error backend harus tampil sebagai error, bukan data mock.

Pekerjaan pada Questions:

- Create, edit, draft/active, category, difficulty, preview, dan assignment ke game.
- Periksa perbedaan frontend correctOptionIndex dengan backend correctAnswer.
- Buat adapter request jika database menyimpan jawaban sebagai string.

Pekerjaan pada Missions/Routes/Floors:

- Pilih game ACTIVE.
- Tampilkan game type, content validity, floor, location, stage, waktu, dan status Playable.
- Hubungkan game ke mission tanpa mengubah file mock.

Preflight validation harus memeriksa config, content minimum, jawaban, mission, location, stage, timer, reward, dan konflik assignment.

Output: admin membuat quiz, mengisi soal, menempatkannya ke mission, dan mengaktifkannya untuk user.

Definition of done: perubahan admin terlihat di user melalui backend tanpa perubahan mock atau rebuild khusus.

Dependency: Phase 1–3 dan endpoint questions/missions.

### Phase 5 — Monitoring, Realtime, dan QA

Tujuan: panitia dapat mengetahui kondisi event dan tim dapat membuktikan integrasi aman.

Admin monitoring minimal menampilkan session id, game, mission, floor/location, team/buddy, jumlah participant, status, server start/end, score, last update, serta error/stuck state.

Action pause, resume, cancel, expire, atau score correction harus memeriksa role, meminta confirmation, membuat audit log, dan tidak mengubah histori tanpa jejak.

Strategi realtime:

1. Stabilkan polling setiap 5–10 detik terlebih dahulu.
2. Subscribe realtime jika backend sudah stabil.
3. Gunakan realtime untuk status dan leaderboard, bukan sebagai satu-satunya sumber kebenaran.
4. Setelah reconnect, refetch state dari API.

Test matrix:

- login valid/invalid;
- role admin, buddy, participant;
- mission upcoming/active/completed;
- game draft/active/inactive;
- no team, no replay, timer expired;
- double submit;
- refresh saat game berjalan;
- network disconnect dan retry;
- dua device pada team yang sama;
- session cancel;
- score correction dan audit log.

Load test bertahap: 10, 50, 100, 250, lalu sekitar 500 concurrent users. Ukur login, available missions, create session, answer, complete, dan leaderboard.

Output: dashboard monitoring dapat digunakan panitia dan hasil QA terdokumentasi.

Definition of done: error penting terlihat, session tidak menggantung tanpa diagnosis, dan skor konsisten antara user, backend, dan admin.

Dependency: seluruh phase sebelumnya.

## Definition of Done untuk Vertical Slice Quiz

- Admin dapat membuat atau mengaktifkan game QUIZ.
- Admin dapat membuat minimal lima soal aktif.
- Admin dapat menghubungkan game ke satu mission dan location.
- User melihat mission sebagai playable.
- User tidak menerima correct answer pada payload awal.
- User dapat membuat dan memulai session.
- User dapat mengirim jawaban.
- Backend menghitung benar/salah dan score.
- Session selesai hanya sekali.
- Refresh/retry tidak menggandakan XP.
- Admin melihat session completed dan skor final.
- Audit log tersedia untuk action admin penting.
- Locked, expired, unauthorized, dan network failure memiliki UI yang jelas.

## Pembagian Pekerjaan

Ian: shared adapter, renderer mapping, user API, gameSessionStore, integrasi MiniGameContainer, submit/complete state, admin API wiring, loading/error/locked states, monitoring UI, dan frontend integration tests.

Backend owner: endpoint contract, authorization, public payload sanitization, session lifecycle, answer validation, server scoring, idempotency, score ledger, dan audit event.

Data/content owner: question bank, game config, mission/floor/location/stage assignment, dan validasi materi.

QA owner: role tests, replay/timer/network tests, load test, dan regression test setiap adapter.

## Milestone Praktis

### Milestone A — Read-only connection

User dapat mengambil mission dan game dari backend. Belum ada skor resmi.

### Milestone B — Playable quiz

User dapat membuat session, start, menjawab, dan melihat hasil dari backend.

### Milestone C — Admin-controlled quiz

Admin dapat membuat soal, menghubungkan game ke mission, toggle active/inactive, dan melihat session.

### Milestone D — Reliable event operation

No replay, idempotency, timer server, audit log, reconnect, polling/realtime, dan load testing selesai.

### Milestone E — Game expansion

Memory, image guess, puzzle, reaction, team challenge, dan exploration ditambahkan satu per satu menggunakan contract serta adapter yang sama.
