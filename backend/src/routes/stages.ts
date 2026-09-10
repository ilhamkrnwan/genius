import { Elysia, t } from "elysia";
import { db } from "../db";
import { stages } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { OFFICIAL_RUNDOWN_LIST } from "../data/officialRundown";

export const stageRoutes = new Elysia({
  prefix: "/api/stages",
  detail: {
    tags: ["Stages & Event Timeline"],
  },
})
  .use(requireAdmin)

  .get("/", async () => {
    const data = await db.select().from(stages).orderBy(asc(stages.order));
    return { success: true, data };
  })

  .get("/:id", async ({ params, set }) => {
    const [stage] = await db.select().from(stages).where(eq(stages.id, params.id)).limit(1);
    if (!stage) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Stage not found" } };
    }
    return { success: true, data: stage };
  })

  .post(
    "/",
    async ({ body }: any) => {
      const [stage] = await db.insert(stages).values({
        name: body.name,
        description: body.description,
        order: body.order,
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
      }).returning();
      return { success: true, data: stage };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        order: t.Number(),
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
      }),
    }
  )

  .put(
    "/:id",
    async ({ params, body, set }: any) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (body.name) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.order !== undefined) updates.order = body.order;
      if (body.status) updates.status = body.status;
      if (body.startTime) updates.startTime = new Date(body.startTime);
      if (body.endTime) updates.endTime = new Date(body.endTime);

      const [stage] = await db.update(stages).set(updates).where(eq(stages.id, params.id)).returning();
      if (!stage) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stage not found" } };
      }
      return { success: true, data: stage };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        order: t.Optional(t.Number()),
        status: t.Optional(t.String()),
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/stages/rundown — Ambil 34 Agenda Resmi Rundown 3 Hari GENIUS 2026
  .get(
    "/rundown",
    async ({ query }) => {
      let list = OFFICIAL_RUNDOWN_LIST;

      if (query.day) {
        const d = Number(query.day);
        list = list.filter((item) => item.day === d);
      }

      if (query.useApp !== undefined && query.useApp !== "") {
        const isApp = query.useApp === "true";
        list = list.filter((item) => item.useApp === isApp);
      }

      if (query.pilar) {
        const p = query.pilar.toLowerCase();
        list = list.filter((item) => item.pilar.toLowerCase().includes(p));
      }

      if (query.search) {
        const q = query.search.toLowerCase().trim();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q) ||
            item.pic.toLowerCase().includes(q) ||
            (item.speaker && item.speaker.toLowerCase().includes(q))
        );
      }

      return {
        success: true,
        data: list,
        total: list.length,
        stats: {
          totalAgenda: OFFICIAL_RUNDOWN_LIST.length,
          day1Count: OFFICIAL_RUNDOWN_LIST.filter((r) => r.day === 1).length,
          day2Count: OFFICIAL_RUNDOWN_LIST.filter((r) => r.day === 2).length,
          day3Count: OFFICIAL_RUNDOWN_LIST.filter((r) => r.day === 3).length,
          appIntegratedCount: OFFICIAL_RUNDOWN_LIST.filter((r) => r.useApp).length,
        },
      };
    },
    {
      query: t.Object({
        day: t.Optional(t.String()),
        useApp: t.Optional(t.String()),
        pilar: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/stages/sync-roadmap — Seed/Sync Official 3-Day Event Roadmap
  .post("/sync-roadmap", async () => {
    const officialStages = [
      {
        order: 1,
        name: "DAY 1: THE INCUBATION & ONBOARDING (22 Sept 2026)",
        description: "Check-In QR presensi, Opening Ceremony akbar, FGD Intention & Agent of Change, Sesi Hubbul Wathan, Literasi Keuangan, Prodi Connect & HMP, serta Daily Check-Out kuesioner.",
        status: "ACTIVE" as const,
        startTime: new Date("2026-09-22T07:00:00+07:00"),
        endTime: new Date("2026-09-22T16:30:00+07:00"),
      },
      {
        order: 2,
        name: "DAY 2: 9-FLOOR CAMPUS QUEST & EXPLORATION (23 Sept 2026)",
        description: "Check-In pagi, Literasi AI & Etika Siber, Simulasi Industri 5.0, Campus Quest 1 & 2 di Lt.1-9 kampus, Sesi Kepesantrenan & Aswaja, serta Check-Out & Leaderboard skor sementara.",
        status: "UPCOMING" as const,
        startTime: new Date("2026-09-23T07:00:00+07:00"),
        endTime: new Date("2026-09-23T16:30:00+07:00"),
      },
      {
        order: 3,
        name: "DAY 3: GRAND QUEST, EXPO ORMAWA & CLOSING (24 Sept 2026)",
        description: "Panduan SIAKAD & Akademik, UNU Berdampak (SDGs), Refleksi Impact, UKM/Ormawa Expo 19 Stan di Lt.3-5, Game Kolosal Angkatan, serta Awarding & Closing Ceremony akbar.",
        status: "UPCOMING" as const,
        startTime: new Date("2026-09-24T07:00:00+07:00"),
        endTime: new Date("2026-09-24T16:30:00+07:00"),
      },
    ];

    const results: any[] = [];
    for (const def of officialStages) {
      const [existing] = await db.select().from(stages).where(eq(stages.order, def.order)).limit(1);
      if (existing) {
        const [updated] = await db
          .update(stages)
          .set({
            name: def.name,
            description: def.description,
            status: existing.status || def.status,
            startTime: def.startTime,
            endTime: def.endTime,
            updatedAt: new Date(),
          })
          .where(eq(stages.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db.insert(stages).values(def).returning();
        results.push(inserted);
      }
    }

    return {
      success: true,
      message: "Berhasil menyinkronkan 3-Day Event Roadmap & Timeline resmi GENIUS 2026!",
      data: results,
    };
  })

  // PUT /api/stages/:id/activate — Activate a stage and adjust other stages
  .put("/:id/activate", async ({ params, set }) => {
    const [targetStage] = await db.select().from(stages).where(eq(stages.id, params.id)).limit(1);
    if (!targetStage) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Stage not found" } };
    }

    const allStages = await db.select().from(stages).orderBy(asc(stages.order));
    for (const s of allStages) {
      let nextStatus: "UPCOMING" | "ACTIVE" | "COMPLETED" = "UPCOMING";
      if (s.order < targetStage.order) {
        nextStatus = "COMPLETED";
      } else if (s.order === targetStage.order) {
        nextStatus = "ACTIVE";
      } else {
        nextStatus = "UPCOMING";
      }

      await db.update(stages).set({ status: nextStatus, updatedAt: new Date() }).where(eq(stages.id, s.id));
    }

    const updatedStages = await db.select().from(stages).orderBy(asc(stages.order));
    return {
      success: true,
      message: `Stage '${targetStage.name}' sekarang aktif sebagai babak utama!`,
      data: updatedStages,
    };
  })

  .delete("/:id", async ({ params, set }) => {
    const [stage] = await db.delete(stages).where(eq(stages.id, params.id)).returning({ id: stages.id });
    if (!stage) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Stage not found" } };
    }
    return { success: true, data: { id: stage.id } };
  });
