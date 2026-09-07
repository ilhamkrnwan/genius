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

  // POST /api/games/sync-defaults — Seed or Sync all Core Game Engines
  .post("/sync-defaults", async () => {
    const defaultGames = [
      {
        name: "Team Quiz Challenge — Wawasan Kampus & Aswaja",
        type: "QUIZ" as const,
        description: "Kuis interaktif wawasan sejarah UNU Yogyakarta, Aswaja An-Nahdliyah, Sains Modern, dan Etika Mahasiswa.",
        instructions: "Jawab setiap soal pilihan ganda bersama tim secara cepat dan akurat untuk memaksimalkan speed bonus & streak multiplier!",
        config: {
          questionsCount: 5,
          timeLimitSeconds: 90,
          timeLimitPerQuestion: 15,
          streakMultiplier: 1.5,
          baseScorePerQuestion: 15,
          maxSpeedBonusPerQuestion: 10,
          maxScore: 100,
        },
        questionBankCategory: "Kampus UNU",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Benar atau Salah — Satgas PPKS & Nilai Integritas",
        type: "RAPID_ANSWER" as const,
        description: "Tantangan kilat evaluasi pernyataan etika kampus, pencegahan kekerasan seksual (PPKS), dan integritas akademik.",
        instructions: "Tentukan apakah pernyataan yang muncul Benar atau Salah sebelum waktu habis. Hati-hati dengan jebakan pernyataan keliru!",
        config: {
          timeLimitSeconds: 60,
          statementCount: 6,
          maxScore: 100,
          passPercentage: 70,
          baseScorePerStatement: 15,
          speedBonus: 10,
        },
        questionBankCategory: "PPKS & Integritas",
        minPlayers: 1,
        maxPlayers: 5,
        status: "ACTIVE" as const,
      },
      {
        name: "Memory Match Matrix — Lambang & Fasilitas UNU",
        type: "MEMORY" as const,
        description: "Permainan mengingat dan mencocokkan pasangan kartu simbol sains, fakultas UNU, dan fasilitas gedung 9 lantai.",
        instructions: "Balik 2 kartu secara berurutan. Cocokkan seluruh pasangan kartu sebelum batas giliran dan waktu berakhir!",
        config: {
          gridSize: "4x4",
          totalPairs: 8,
          timeLimitSeconds: 120,
          scorePerMatch: 15,
          maxScore: 100,
          maxFlipsAllowed: 28,
          pairs: [
            { id: "unu", labelA: "UNU", labelB: "Universitas Nahdlatul Ulama", tag: "KAMPUS" },
            { id: "fti", labelA: "FTI", labelB: "Fakultas Teknologi Informasi", tag: "FAKULTAS" },
            { id: "ai", labelA: "AI Lab", labelB: "Laboratorium Kecerdasan Buatan Lt.3", tag: "TEKNOLOGI" },
            { id: "sky-garden", labelA: "Sky Garden", labelB: "Rooftop Lantai 9", tag: "LOKASI" },
            { id: "feb", labelA: "FEB", labelB: "Fakultas Ekonomi & Bisnis", tag: "FAKULTAS" },
            { id: "perpustakaan", labelA: "Perpus", labelB: "Jurnal Digital Lantai 5", tag: "FASILITAS" },
            { id: "aswaja", labelA: "Aswaja", labelB: "Ahlussunnah wal Jama'ah", tag: "NILAI" },
            { id: "ppks", labelA: "PPKS", labelB: "Satgas Ruang Aman", tag: "INTEGRITAS" },
          ],
        },
        questionBankCategory: "Memori",
        minPlayers: 1,
        maxPlayers: 5,
        status: "ACTIVE" as const,
      },
      {
        name: "Teka-Teki Silang (TTS) — Khazanah Kampus Hijau",
        type: "PUZZLE" as const,
        description: "Teka-teki silang mendatar & menurun menguji pemahaman sejarah kampus, tokoh NU, dan wawasan kebangsaan.",
        instructions: "Pilih kotak kata, baca petunjuk clue mendatar/menurun, lalu ketik huruf jawaban hingga seluruh kotak terisi sempurna!",
        config: {
          gridRows: 6,
          gridCols: 8,
          timeLimitSeconds: 180,
          maxScore: 100,
          totalClues: 4,
        },
        questionBankCategory: "Teka-Teki",
        minPlayers: 1,
        maxPlayers: 5,
        status: "ACTIVE" as const,
      },
      {
        name: "Tebak Kata Sandi — Anagram & Istilah Akademik",
        type: "WORD_GAME" as const,
        description: "Tantangan menyusun kembali huruf-huruf yang teracak menjadi kata kunci ilmiah, nilai integritas, dan filosofi UNU.",
        instructions: "Seret dan letakkan huruf yang tersedia pada slot jawaban sesuai petunjuk definisi. Manfaatkan tombol hint jika mengalami kebuntuan!",
        config: {
          totalWords: 5,
          timeLimitSeconds: 90,
          maxScore: 100,
          hintPenalty: 5,
          shuffleAllowed: true,
        },
        questionBankCategory: "Logika Kata",
        minPlayers: 1,
        maxPlayers: 5,
        status: "ACTIVE" as const,
      },
      {
        name: "Tebak Posisi & Denah — Navigasi Spasial Gedung",
        type: "LOGIC" as const,
        description: "Uji orientasi spasial dan pengetahuan lokasi gedung kampus UNU. Tebak titik koordinat ruangan atau fasilitas yang diminta.",
        instructions: "Perhatikan nama ruangan/fasilitas yang dicari, lalu klik pin pada denah interaktif seakurat mungkin. Semakin dekat dengan titik asli, semakin besar poinmu!",
        config: {
          toleranceRadiusPx: 40,
          totalRounds: 4,
          timeLimitSeconds: 90,
          maxScore: 100,
          bonusAccuracy: 20,
        },
        questionBankCategory: "Spasial Kampus",
        minPlayers: 1,
        maxPlayers: 5,
        status: "ACTIVE" as const,
      },
      {
        name: "Tebak Gambar & AI Canvas — Kurator Seni Senior",
        type: "IMAGE_GUESS" as const,
        description: "Visual mystery guessing & canvas drawing challenge dinilai langsung oleh AI Art Curator atau ditebak dari petunjuk gambar bertahap.",
        instructions: "Buka lapisan petunjuk visual atau lukis objek sesuai instruksi prompt sebelum batas waktu habis!",
        config: {
          drawingTimeSeconds: 60,
          aiModel: "gemini-2.0-flash",
          maxScore: 100,
          allowColorPalette: true,
          persona: "SARCASTIC_EDUCATIONAL",
          scratchRevealDuration: 45,
        },
        questionBankCategory: "Kreativitas",
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE" as const,
      },
      {
        name: "Kuis Balapan Regu — Fast Grand Prix UNU",
        type: "TEAM_CHALLENGE" as const,
        description: "Balapan kuis kooperatif antar regu. Jawaban benar dan cepat memacu laju kendaraan/maskot tim menuju garis akhir!",
        instructions: "Pilih jawaban benar secepat kilat bersama rekan regumu. Rangkaian combo jawaban benar memberikan turbo speed boost!",
        config: {
          lapsToWin: 5,
          streakSpeedBoost: 1.5,
          timeLimitSeconds: 120,
          maxScore: 150,
          minPlayers: 2,
          maxPlayers: 10,
        },
        questionBankCategory: "Balapan Regu",
        minPlayers: 2,
        maxPlayers: 10,
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
      {
        name: "Speed Reaction Blitz — Cyber Reflex Tap",
        type: "REACTION" as const,
        description: "Arena uji kecepatan refleks sensorik. Tap target cyber neon yang muncul secepat kilat untuk mengumpulkan poin tim.",
        instructions: "Ketuk target hijau/emas segera saat muncul. Hindari jebakan target merah yang memotong poin!",
        config: {
          targetCount: 15,
          spawnIntervalMs: 1200,
          timeLimitSeconds: 45,
          maxScore: 100,
          missPenaltyScore: 5,
        },
        questionBankCategory: "Refleks",
        minPlayers: 1,
        maxPlayers: 5,
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
    ];

    const results: any[] = [];
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

    return {
      success: true,
      message: `Berhasil menyinkronkan ${results.length} engine game default ke database!`,
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
