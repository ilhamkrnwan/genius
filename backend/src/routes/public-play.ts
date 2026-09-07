import { Elysia } from "elysia";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { games, locations, missions, floors, stages } from "../db/schema";
import { requireUser } from "../middleware/auth";

function sanitizePublicConfig(rawConfig: unknown) {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) return {};

  const config = { ...(rawConfig as Record<string, unknown>) };
  const questions = Array.isArray(config.questions)
    ? config.questions.map((rawQuestion) => {
        if (!rawQuestion || typeof rawQuestion !== "object" || Array.isArray(rawQuestion)) return rawQuestion;
        const question = rawQuestion as Record<string, unknown>;
        const { correctAnswer, correctAnswerIndex, explanation, ...publicQuestion } = question;
        void correctAnswer;
        void correctAnswerIndex;
        void explanation;
        return publicQuestion;
      })
    : undefined;

  return questions ? { ...config, questions } : config;
}

function toPublicMission(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    locationId: row.locationId,
    locationCode: row.locationCode,
    locationName: row.locationName,
    floorNumber: row.floorNumber,
    stageId: row.stageId,
    timeLimit: row.timeLimit,
    isRequired: row.isRequired,
    status: row.status,
    game: row.gameId
      ? {
          id: row.gameId,
          name: row.gameName,
          type: row.gameType,
          status: row.gameStatus,
          description: row.gameDescription,
          instructions: row.gameInstructions,
          config: sanitizePublicConfig(row.gameConfig),
          questionBankCategory: row.questionBankCategory,
          minPlayers: row.minPlayers,
          maxPlayers: row.maxPlayers,
        }
      : null,
  };
}

const missionSelection = {
  id: missions.id,
  name: missions.name,
  description: missions.description,
  locationId: missions.locationId,
  locationCode: locations.code,
  locationName: locations.name,
  floorNumber: floors.number,
  stageId: missions.stageId,
  timeLimit: missions.timeLimit,
  isRequired: missions.isRequired,
  status: missions.status,
  gameId: games.id,
  gameName: games.name,
  gameType: games.type,
  gameStatus: games.status,
  gameDescription: games.description,
  gameInstructions: games.instructions,
  gameConfig: games.config,
  questionBankCategory: games.questionBankCategory,
  minPlayers: games.minPlayers,
  maxPlayers: games.maxPlayers,
};

export const publicPlayRoutes = new Elysia({
  detail: { tags: ["Participant Game Play"] },
})
  .use(requireUser)
  .get("/api/me/missions/available", async () => {
    const rows = await db
      .select(missionSelection)
      .from(missions)
      .innerJoin(locations, eq(missions.locationId, locations.id))
      .leftJoin(floors, eq(locations.floorId, floors.id))
      .leftJoin(stages, eq(missions.stageId, stages.id))
      .leftJoin(games, eq(missions.gameId, games.id))
      .where(and(eq(missions.status, "ACTIVE"), eq(games.status, "ACTIVE")))
      .orderBy(asc(missions.order));

    return { success: true, data: rows.filter((row) => row.gameId).map(toPublicMission), timestamp: new Date().toISOString() };
  })
  .get("/api/missions/:id/play", async ({ params, set }) => {
    const [row] = await db
      .select(missionSelection)
      .from(missions)
      .innerJoin(locations, eq(missions.locationId, locations.id))
      .leftJoin(floors, eq(locations.floorId, floors.id))
      .leftJoin(stages, eq(missions.stageId, stages.id))
      .leftJoin(games, eq(missions.gameId, games.id))
      .where(eq(missions.id, params.id))
      .limit(1);

    if (!row) {
      set.status = 404;
      return { success: false, error: { code: "MISSION_NOT_FOUND", message: "Mission tidak ditemukan." } };
    }

    if (row.status !== "ACTIVE" || row.gameStatus !== "ACTIVE" || !row.gameId) {
      return {
        success: true,
        data: { ...toPublicMission(row), status: "LOCKED", lockedReason: "Mission atau game belum aktif." },
        timestamp: new Date().toISOString(),
      };
    }

    return { success: true, data: toPublicMission(row), timestamp: new Date().toISOString() };
  });
