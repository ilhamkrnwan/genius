import { Elysia, t } from "elysia";
import { db } from "../db";
import { games, missions, questions, locations, stages } from "../db/schema";
import { eq, sql, desc, or, ilike, inArray, and } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

async function getGamePlayability(gameId: string, ignoreStatus = false) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return null;
  const config = (game.config && typeof game.config === "object" ? game.config : {}) as Record<string, any>;
  const reasons: string[] = [];
  const validStatus = game.status === "ACTIVE";
  const validConfig = Object.keys(config).length > 0;
  if (!validStatus && !ignoreStatus) reasons.push("Game belum berstatus ACTIVE.");
  if (!validConfig) reasons.push("Konfigurasi game masih kosong.");

  let hasContent = validConfig;
  if (game.type === "QUIZ") {
    const category = game.questionBankCategory?.trim();
    const rows = category
      ? await db.select({ id: questions.id }).from(questions).where(and(eq(questions.category, category), eq(questions.status, "ACTIVE"))).limit(1)
      : [];
    const activeQuestions = rows.length > 0
      ? rows
      : await db.select({ id: questions.id }).from(questions).where(eq(questions.status, "ACTIVE")).limit(1);
    // Accept both the canonical field and legacy seeded records. Runtime
    // question loading uses the same active-question fallback behavior.
    const requestedQuestionCount = Number(config.questionsCount ?? config.questionCount ?? 0);
    hasContent = activeQuestions.length > 0 || requestedQuestionCount > 0 || (Array.isArray(config.questions) && config.questions.length > 0);
    if (!hasContent) reasons.push("Belum ada soal aktif atau konfigurasi jumlah soal.");
  } else if (game.type === "MEMORY") {
    hasContent = Array.isArray(config.pairs) && config.pairs.length > 0;
    if (!hasContent) reasons.push("Belum ada pasangan kartu memory.");
  }

  const assignments = await db.select({ id: missions.id }).from(missions).where(and(eq(missions.gameId, game.id), eq(missions.status, "ACTIVE"))).limit(1);
  const assignedToActiveMission = assignments.length > 0;
  if (!assignedToActiveMission) reasons.push("Game belum ditempatkan pada mission aktif.");

  return { playable: (validStatus || ignoreStatus) && validConfig && hasContent && assignedToActiveMission, reasons, checks: { validStatus, validConfig, hasContent, assignedToActiveMission } };
}

export const gameRoutes = new Elysia({
  prefix: "/api/games",
  detail: {
    tags: ["Mini Games & Quests"],
  },
})
  .use(requireAdmin)

  .get("/:id/preflight", async ({ params, set }) => {
    const result = await getGamePlayability(params.id);
    if (!result) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Game definition not found" } };
    }
    return { success: true, data: result };
  })

  // GET /api/games — List all game definitions with mission usage counts
  .get("/", async ({ query }) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 50;
    const offset = (page - 1) * pageSize;
    const type = query.type || "";
    const status = query.status || "";
    const search = query.search?.trim();

    let q = db.select().from(games).$dynamic();

    if (type) {
      q = q.where(eq(games.type, type as any));
    }
    if (status) {
      q = q.where(eq(games.status, status as any));
    }
    if (search) {
      q = q.where(or(ilike(games.name, `%${search}%`), ilike(games.description, `%${search}%`)));
    }

    const allGames = await q.orderBy(desc(games.createdAt)).limit(pageSize).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(games);

    if (allGames.length === 0) {
      return {
        success: true,
        data: [],
        meta: { page, pageSize, total: Number(count) },
      };
    }

    const gameIds = allGames.map((g) => g.id);

    // Aggregate mission usage
    const missionCounts = await db
      .select({
        gameId: missions.gameId,
        count: sql<number>`count(*)`,
      })
      .from(missions)
      .where(inArray(missions.gameId, gameIds))
      .groupBy(missions.gameId);

    const usageMap = new Map(missionCounts.map((m) => [m.gameId, Number(m.count)]));

    const data = allGames.map((g) => ({
      ...g,
      missionUsageCount: usageMap.get(g.id) || 0,
    }));

    return {
      success: true,
      data,
      meta: { page, pageSize, total: Number(count) },
    };
  })

  // GET /api/games/:id — Get single game definition
  .get("/:id", async ({ params, set }) => {
    const [game] = await db.select().from(games).where(eq(games.id, params.id)).limit(1);
    if (!game) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Game definition not found" } };
    }
    return { success: true, data: game };
  })

  // POST /api/games — Create new game definition
  .post(
    "/",
    async ({ body }) => {
      const [game] = await db
        .insert(games)
        .values({
          name: body.name.trim(),
          description: body.description?.trim() || null,
          instructions: body.instructions?.trim() || null,
          type: body.type as any,
          config: body.config || {},
          questionBankCategory: body.questionBankCategory?.trim() || null,
          minPlayers: body.minPlayers ?? 1,
          maxPlayers: body.maxPlayers ?? 12,
          status: (body.status as any) || "ACTIVE",
        })
        .returning();

      return { success: true, data: game };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        instructions: t.Optional(t.String()),
        type: t.String(),
        config: t.Optional(t.Record(t.String(), t.Any())),
        questionBankCategory: t.Optional(t.String()),
        minPlayers: t.Optional(t.Number()),
        maxPlayers: t.Optional(t.Number()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // PUT /api/games/:id — Update game definition
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (body.name) updates.name = body.name.trim();
      if (body.description !== undefined) updates.description = body.description?.trim() || null;
      if (body.instructions !== undefined) updates.instructions = body.instructions?.trim() || null;
      if (body.type) updates.type = body.type;
      if (body.config !== undefined) updates.config = body.config;
      if (body.questionBankCategory !== undefined) updates.questionBankCategory = body.questionBankCategory?.trim() || null;
      if (body.minPlayers !== undefined) updates.minPlayers = body.minPlayers;
      if (body.maxPlayers !== undefined) updates.maxPlayers = body.maxPlayers;
      if (body.status) updates.status = body.status;

      const [game] = await db
        .update(games)
        .set(updates)
        .where(eq(games.id, params.id))
        .returning();

      if (!game) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Game definition not found" } };
      }

      return { success: true, data: game };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.Nullable(t.String())),
        instructions: t.Optional(t.Nullable(t.String())),
        type: t.Optional(t.String()),
        config: t.Optional(t.Record(t.String(), t.Any())),
        questionBankCategory: t.Optional(t.Nullable(t.String())),
        minPlayers: t.Optional(t.Number()),
        maxPlayers: t.Optional(t.Number()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/games/sync-defaults — Seed or Sync all Core Game Engines (12 Games: 9 Pos + 3 Special Features)
  .post("/sync-defaults", async () => {
    const defaultGames = [
      {
        name: "Pos 1 — Studi Kasus Integritas & Anti Korupsi",
        type: "QUIZ" as const,
        description: "Tantangan 8 studi kasus pilihan ganda menguji integritas pengelolaan dana, whistleblowing, dan pencegahan intoleransi.",
        instructions: "Pilih tindakan paling tepat untuk setiap dilema etika kampus sebelum waktu habis.",
        config: {
          totalQuestions: 8,
          questionsCount: 8,
          timeLimitSeconds: 120,
          timeLimitPerQuestion: 15,
          maxScore: 100,
          scoringMap: [13, 12, 13, 12, 13, 12, 13, 12],
        },
        questionBankCategory: "Anti Korupsi dan Terorisme",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 2 — Leadership Memory Match",
        type: "MEMORY" as const,
        description: "Mencocokkan 5 pasangan kartu konsep kepemimpinan dengan tindakan nyata pemecahan masalah di organisasi.",
        instructions: "Balik kartu secara berurutan dan pasangkan prinsip leadership dengan solusi kasus praktisnya!",
        config: {
          totalPairs: 5,
          timeLimitSeconds: 90,
          maxScore: 100,
          pairs: [
            { id: "p1", labelA: "Integritas", labelB: "Jujur dan konsisten antara perkataan dan perbuatan", score: 15, tag: "KARAKTER" },
            { id: "p2", labelA: "Delegasi", labelB: "Breakdown tugas menjadi bagian kecil & bagi peran sesuai keahlian", score: 20, tag: "MANAJEMEN" },
            { id: "p3", labelA: "Penanganan Anggota Numpang Nama", labelB: "Kasih deadline & tenggat tegas, kalau tetep ghosting baru lapor dosen", score: 25, tag: "TEAMWORK" },
            { id: "p4", labelA: "Visioner", labelB: "Punya Pandangan Jauh Kedepan Untuk Organisasi", score: 15, tag: "PERENCANAAN" },
            { id: "p5", labelA: "Problem Solving", labelB: "Rundown acara mendadak berantakan karena mati listrik: Tetap tenang, alihkan ke ice breaking manual sambil backup teknis", score: 25, tag: "KEPUTUSAN" },
          ],
        },
        questionBankCategory: "Leadership",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 3 — Benar atau Salah Pelajar Pancasila",
        type: "RAPID_ANSWER" as const,
        description: "Tantangan kilat evaluasi 5 pernyataan kritis terkait dimensi profil pelajar Pancasila & kemandirian mahasiswa.",
        instructions: "Tentukan apakah setiap pernyataan yang ditampilkan Benar atau Salah secara tepat dan cepat!",
        config: {
          statementCount: 5,
          timeLimitSeconds: 60,
          maxScore: 100,
          scoringMap: [15, 20, 20, 20, 25],
        },
        questionBankCategory: "Profil Pelajar Pancasila",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 4 — TTS Kampus Bersinar Bebas Narkoba",
        type: "PUZZLE" as const,
        description: "Teka-teki silang 5 kata mendatar & menurun tentang kesadaran bahaya narkoba, rehabilitasi, dan penolakan ajakan adiktif.",
        instructions: "Pilih nomor soal TTS, baca petunjuk mendatar/menurun, lalu isi jawaban ke dalam kotak grid!",
        config: {
          gridRows: 10,
          gridCols: 10,
          timeLimitSeconds: 120,
          maxScore: 100,
          words: ["NARKOBA", "KETAGIHAN", "BEBAS", "REHAB", "TOLAK"],
        },
        questionBankCategory: "Anti Narkoba",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 5 — Tebak Kata Siapakah Aku: Anti Plagiarisme",
        type: "WORD_GAME" as const,
        description: "Riddle akademis tebak kata: identifikasi istilah penting seputar orisinalitas karya, sitasi, referensi, dan integritas.",
        instructions: "Baca petunjuk definisi 'Siapakah aku?', lalu susun huruf jawaban dengan benar sebelum batas waktu!",
        config: {
          totalWords: 5,
          timeLimitSeconds: 90,
          maxScore: 100,
          scoringMap: [10, 20, 20, 25, 25],
        },
        questionBankCategory: "Anti Plagiarisme",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 6 — Media Sosial & Komunikasi Efektif",
        type: "QUIZ" as const,
        description: "Tantangan etika bermedia sosial, literasi informasi, dan komunikasi santun civitas akademika.",
        instructions: "Jawab pertanyaan singkat dan analisis kasus etika komunikasi digital secara tepat!",
        config: {
          totalQuestions: 8,
          questionsCount: 8,
          timeLimitSeconds: 90,
          timeLimitPerQuestion: 15,
          maxScore: 100,
        },
        questionBankCategory: "Media Sosial dan Komunikasi",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 7 — Fun Pos Tebak Gambar Kreatif",
        type: "IMAGE_GUESS" as const,
        description: "Tantangan tebak visual gambar dan kreativitas pengamatan mahasiswa baru.",
        instructions: "Amati petunjuk visual yang terbuka dan tebak objek atau makna di baliknya!",
        config: {
          totalQuestions: 5,
          timeLimitSeconds: 60,
          maxScore: 100,
        },
        questionBankCategory: "Fun Pos",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 8 — Ingat Aku: Tebak Lokasi Lantai Gedung",
        type: "LOGIC" as const,
        description: "Tebak lokasi lantai berdasarkan 5 foto sudut fasilitas kampus UNU (Amphiteater, rooftop, selasar, student center).",
        instructions: "Perhatikan foto lokasi yang disajikan, lalu pilih di lantai berapakah ruangan tersebut berada!",
        config: {
          totalQuestions: 5,
          timeLimitSeconds: 60,
          maxScore: 100,
          scorePerQuestion: 20,
        },
        questionBankCategory: "Ingat Aku - Posisi",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Pos 9 — Ingat Aku: Teks Blur & 3 Tokoh NU",
        type: "IMAGE_GUESS" as const,
        description: "Uji ketelitian membaca teks dinding kampus yang diblur dan sebutkan 3 tokoh pendiri NU secara urut.",
        instructions: "Baca teks samar pada gambar fasilitas kampus dan susun nama tokoh sejarah secara presisi!",
        config: {
          totalQuestions: 5,
          timeLimitSeconds: 90,
          maxScore: 100,
          scorePerQuestion: 20,
        },
        questionBankCategory: "Ingat Aku - Tulisan",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Day 1 Incubation — Profiling Karakter & Visi 4 Tahun",
        type: "EXPLORATION" as const,
        description: "16 Skenario interaktif kepemimpinan, riset, dan dinamika tim untuk memetakan Archetype petualang serta ulasan mentor AI.",
        instructions: "Pilih respon keputusan yang paling mencerminkan dirimu. Dapatkan peta radar 5 Traits dan gelar inisiat!",
        config: {
          totalScenarios: 16,
          completionRewardPoints: 100,
          isGameMasterLocked: false,
          aiModel: "gemini-2.0-flash",
        },
        questionBankCategory: "Psikologi",
        minPlayers: 1,
        maxPlayers: 50,
        status: "ACTIVE" as const,
      },
      {
        name: "Boss Showdown — Raid Pertarungan Lantai 9",
        type: "TEAM_CHALLENGE" as const,
        description: "Pertarungan kooperatif pamungkas di Sky Garden Lantai 9 menghadapi Guardian AI untuk penentuan juara angkatan.",
        instructions: "Kombinasikan skill kelas RPG regu kalian, selesaikan Quick-Time Event bersama, dan kalahkan Boss sebelum waktu habis!",
        config: {
          bossMaxHp: 5000,
          timeLimitSeconds: 180,
          qteIntervalSeconds: 8,
          teamDamageMultiplier: 1.25,
          maxScore: 250,
        },
        questionBankCategory: "Boss Raid",
        minPlayers: 3,
        maxPlayers: 20,
        status: "ACTIVE" as const,
      },
      {
        name: "Flappy Genius — Terbang Melampaui Nilai UNU",
        type: "FLAPPY_BIRD" as const,
        description: "Arcade retro pixel flyer: kendalikan maskot Genius melewati pilar-pilar nilai Aswaja & integritas kampus tanpa menabrak.",
        instructions: "Tap atau tekan tombol SPACE untuk terbang melompat. Lewati setiap pilar nilai untuk mengumpulkan XP & poin kelulusan pos!",
        config: {
          pipeSpeed: 200,
          gapSize: 140,
          pipeInterval: 1800,
          gravity: 800,
          jumpForce: -360,
          durationSeconds: 60,
          xpPerPipe: 5,
          maxScore: 100,
          pipeLabels: ["Tasamuh", "Tawasuth", "I'tidal", "Tawazun", "Amar Ma'ruf", "Nahi Munkar"],
        },
        questionBankCategory: "Arcade",
        minPlayers: 1,
        maxPlayers: 1,
        status: "ACTIVE" as const,
      },
    ];

    const results: any[] = [];
    const officialNames = defaultGames.map((d) => d.name);

    for (const def of defaultGames) {
      const [existing] = await db.select().from(games).where(eq(games.name, def.name)).limit(1);
      if (existing) {
        const [updated] = await db
          .update(games)
          .set({
            name: def.name,
            description: def.description,
            instructions: def.instructions,
            type: def.type,
            config: def.config,
            questionBankCategory: def.questionBankCategory,
            minPlayers: def.minPlayers,
            maxPlayers: def.maxPlayers,
            status: "ACTIVE",
            updatedAt: new Date(),
          })
          .where(eq(games.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db.insert(games).values(def).returning();
        results.push(inserted);
      }
    }

    // Archive any legacy games that are not in the official list
    const allGamesInDb = await db.select().from(games);
    for (const g of allGamesInDb) {
      if (!officialNames.includes(g.name) && g.status === "ACTIVE") {
        await db.update(games).set({ status: "INACTIVE" }).where(eq(games.id, g.id));
      }
    }

    return {
      success: true,
      message: `Berhasil menyinkronkan ${results.length} engine game resmi ke database!`,
      data: results,
    };
  })

  // PUT /api/games/:id/toggle-status — Quick toggle between ACTIVE and INACTIVE
  .put("/:id/toggle-status", async ({ params, set }) => {
    const [game] = await db.select().from(games).where(eq(games.id, params.id)).limit(1);
    if (!game) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Game not found" } };
    }

    const nextStatus = game.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (nextStatus === "ACTIVE") {
      // Check content and mission assignment without rejecting the current
      // INACTIVE status that this operation is about to change.
      const readiness = await getGamePlayability(params.id, true);
      if (!readiness?.playable) {
        set.status = 422;
        return { success: false, error: { code: "GAME_NOT_PLAYABLE", message: "Game belum siap diaktifkan.", reasons: readiness?.reasons || [] } };
      }
    }

    // Ensure the default Memory engine is reachable from the user journey.
    // Existing deployments may have games but no mission for newly added
    // engines, so sync creates one on the first active location/stage.
    const [memoryGame] = await db.select().from(games).where(eq(games.type, "MEMORY")).limit(1);
    const [activeLocation] = await db.select().from(locations).where(eq(locations.status, "AVAILABLE")).limit(1);
    const [activeStage] = await db.select().from(stages).where(eq(stages.status, "ACTIVE")).limit(1);
    if (memoryGame && activeLocation && activeStage) {
      const [memoryMission] = await db
        .select({ id: missions.id })
        .from(missions)
        .where(eq(missions.gameId, memoryGame.id))
        .limit(1);
      if (!memoryMission) {
        await db.insert(missions).values({
          name: `Misi ${memoryGame.name}`,
          description: "Cocokkan pasangan kartu bertema UNU Yogyakarta.",
          type: "MAIN",
          locationId: activeLocation.id,
          stageId: activeStage.id,
          gameId: memoryGame.id,
          order: 90,
          isRequired: false,
          timeLimit: 120,
          status: "ACTIVE",
        });
      }
    }
    const [updated] = await db
      .update(games)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(games.id, params.id))
      .returning();

    return {
      success: true,
      message: `Status game '${updated.name}' diubah menjadi ${nextStatus}.`,
      data: updated,
    };
  })

  // DELETE /api/games/:id — Delete game definition
  .delete("/:id", async ({ params, set }) => {
    const [game] = await db
      .delete(games)
      .where(eq(games.id, params.id))
      .returning({ id: games.id });

    if (!game) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Game definition not found" } };
    }

    return { success: true, data: { id: game.id } };
  });
