import { db } from "../db";
import { questions } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

export interface GameEngineInput {
  gameType: "TEAM_QUIZ" | "SPEED_REACTION" | "MEMORY_MATCH" | "PUZZLE_ORDER" | "CUSTOM" | string;
  gameConfig: Record<string, any>;
  submissions: Array<{
    participantId: string;
    action: string;
    answer?: any;
    timestampMs?: number;
    statMultiplier?: number;
  }>;
  serverStartAt: Date;
  serverEndAt: Date;
  timeLimitSec: number;
}

export interface ParticipantScoreResult {
  participantId: string;
  baseScore: number;
  speedBonus: number;
  statBoostBonus: number;
  penalty: number;
  finalScore: number;
  details: Record<string, any>;
}

export interface GameEngineResult {
  success: boolean;
  totalTeamScore: number;
  participantScores: ParticipantScoreResult[];
  completionTimeMs: number;
  isPerfect: boolean;
  summary: string;
}

/**
 * Modular Server-Authoritative Game Engine
 */
export class GameEngine {
  /**
   * Initializes game payload (e.g. fetching questions or initializing grid/puzzle state)
   */
  static async initializeGamePayload(gameType: string, config: Record<string, any>, category?: string | null) {
    switch (gameType) {
      case "TEAM_QUIZ":
      case "QUIZ": {
        // Support both the canonical field and older seeded game records.
        const count = config.questionsCount ?? config.questionCount ?? 5;
        let q = db.select().from(questions).where(eq(questions.status, "ACTIVE")).$dynamic();
        if (category) {
          q = q.where(eq(questions.category, category));
        }
        let available = await q.limit(50);

        // A game may retain a legacy category label that is not present in the
        // current question bank. Do not create an unplayable empty session;
        // fall back to all active questions while keeping answers private.
        if (available.length < count && category) {
          available = await db
            .select()
            .from(questions)
            .where(eq(questions.status, "ACTIVE"))
            .limit(50);
        }
        // Shuffle & pick N
        const shuffled = available.sort(() => Math.random() - 0.5).slice(0, count);
        return {
          questions: shuffled.map((sq) => ({
            id: sq.id,
            questionText: sq.questionText,
            type: sq.type,
            options: sq.options,
            baseScore: sq.baseScore,
            category: sq.category,
            // Do NOT include correctAnswer in client payload!
          })),
        };
      }

      case "SPEED_REACTION": {
        const rounds = config.rounds || 3;
        const delayMinMs = config.delayMinMs || 2000;
        const delayMaxMs = config.delayMaxMs || 5000;
        return {
          rounds,
          delays: Array.from({ length: rounds }, () => Math.floor(Math.random() * (delayMaxMs - delayMinMs)) + delayMinMs),
        };
      }

      case "MEMORY_MATCH": {
        // If the game config already has predefined pairs (like in mockData), use them!
        if (config.pairs && Array.isArray(config.pairs) && config.pairs.length > 0) {
          return { pairs: config.pairs };
        }
        
        // Otherwise generate fallback pairs using symbols
        const pairCount = config.pairCount || 6;
        const symbols = ["🛡️", "🔮", "🏹", "🧪", "🗡️", "📜", "⚡", "⚙️"];
        const chosen = symbols.slice(0, pairCount);
        const pairs = chosen.map((symbol, idx) => ({
          id: `mm-auto-${idx}`,
          labelA: symbol,
          labelB: symbol,
          tag: 'Symbol',
        }));
        
        return {
          pairs,
        };
      }

      case "PUZZLE_ORDER": {
        const steps = config.steps || [
          "Inisialisasi Sistem",
          "Koneksi Database LAN",
          "Routing Jaringan Kampus",
          "Verifikasi Kunci Kriptografi",
          "Aktivasi Firewall UNU",
        ];
        return {
          targetLength: steps.length,
          shuffledSteps: [...steps].sort(() => Math.random() - 0.5),
        };
      }

      default:
        return {
          config,
        };
    }
  }

  /**
   * Evaluates participant submissions server-side to calculate final score
   */
  static async evaluateGameSession(input: GameEngineInput): Promise<GameEngineResult> {
    const elapsedMs = Math.max(0, input.serverEndAt.getTime() - input.serverStartAt.getTime());
    const timeLimitMs = (input.timeLimitSec || 300) * 1000;

    let participantScores: ParticipantScoreResult[] = [];
    let totalTeamScore = 0;
    let isPerfect = true;

    // Normalize submissions: if empty, provide a fallback player entry
    const rawSubmissions = input.submissions.length > 0
      ? input.submissions
      : [{ participantId: "team-player" }];

    switch (input.gameType) {
      case "TEAM_QUIZ":
      case "QUIZ": {
        // Collect question IDs
        const questionIds: string[] = [];
        rawSubmissions.forEach((s) => {
          if (Array.isArray(s.answer)) {
            s.answer.forEach((ans: any) => {
              if (ans.questionId) questionIds.push(ans.questionId);
            });
          }
        });

        const distinctQIds = Array.from(new Set(questionIds));
        let qRecords: any[] = [];
        if (distinctQIds.length > 0) {
          qRecords = await db.select().from(questions).where(inArray(questions.id, distinctQIds));
        }
        const qMap = new Map(qRecords.map((q) => [q.id, q]));

        participantScores = rawSubmissions.map((sub: any) => {
          let base = 0;
          let correctCount = 0;
          let totalCount = 0;

          if (typeof sub.score === "number") {
            base = Math.min(100, Math.max(0, sub.score));
            correctCount = sub.totalQuestions ? Math.round((base / 100) * sub.totalQuestions) : 8;
            totalCount = sub.totalQuestions || 8;
          } else if (Array.isArray(sub.answer)) {
            totalCount = sub.answer.length;
            sub.answer.forEach((ans: any) => {
              const qRecord = qMap.get(ans.questionId);
              const selected = String(ans.selected).trim().toLowerCase();
              const correct = String(qRecord?.correctAnswer ?? "").trim().toLowerCase();
              const options = Array.isArray(qRecord?.options) ? qRecord.options : [];
              const selectedOption = Number.isInteger(Number(ans.selected)) ? options[Number(ans.selected)] : undefined;
              const isCorrect = Boolean(qRecord) && (
                selected === correct ||
                String(selectedOption ?? "").trim().toLowerCase() === correct
              );
              if (isCorrect) {
                base += qRecord?.baseScore || 10;
                correctCount++;
              } else {
                isPerfect = false;
              }
            });
          } else {
            base = Math.min(100, input.gameConfig.baseScore || input.gameConfig.maxScore || 100);
          }

          // Exact score strictly adhering to question weights in quiz_database.csv (max 100 pts per pos)
          const finalScore = Math.min(100, Math.max(0, base));
          if (finalScore < 100) isPerfect = false;

          return {
            participantId: sub.participantId,
            baseScore: finalScore,
            speedBonus: 0,
            statBoostBonus: 0,
            penalty: 0,
            finalScore,
            details: { correctCount, totalCount, accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0 },
          };
        });
        break;
      }

      case "MEMORY_MATCH": {
        participantScores = rawSubmissions.map((sub: any) => {
          let base = 100;
          if (typeof sub.score === "number") {
            base = Math.min(100, Math.max(0, sub.score));
          } else if (sub.answer?.matchedPairs !== undefined) {
            const pairScores = [15, 20, 25, 15, 25];
            const matched = Math.min(5, Math.max(0, Number(sub.answer.matchedPairs)));
            base = pairScores.slice(0, matched).reduce((a, b) => a + b, 0);
          } else if (sub.answer?.moves !== undefined) {
            base = 100;
          }
          const finalScore = Math.min(100, Math.max(0, base));
          if (finalScore < 100) isPerfect = false;
          return {
            participantId: sub.participantId,
            baseScore: finalScore,
            speedBonus: 0,
            statBoostBonus: 0,
            penalty: 0,
            finalScore,
            details: { moves: sub.answer?.moves || 0, elapsedMs },
          };
        });
        break;
      }

      default: {
        // PUZZLE (TTS), WORD_GAME (Tebak Kata), LOGIC (Benar/Salah & Tebak Posisi), IMAGE_GUESS (Tebak Gambar & Teks Blur)
        participantScores = rawSubmissions.map((sub: any) => {
          let base = 100;
          if (typeof sub.score === "number") {
            base = Math.min(100, Math.max(0, sub.score));
          } else if (typeof sub.answer?.score === "number") {
            base = Math.min(100, Math.max(0, sub.answer.score));
          } else {
            base = Math.min(100, Math.max(0, Number(input.gameConfig.maxScore || input.gameConfig.baseScore || 100)));
          }
          const finalScore = Math.min(100, Math.max(0, base));
          if (finalScore < 100) isPerfect = false;
          return {
            participantId: sub.participantId,
            baseScore: finalScore,
            speedBonus: 0,
            statBoostBonus: 0,
            penalty: 0,
            finalScore,
            details: { ...sub.answer },
          };
        });
        break;
      }
    }

    // Team score for this pos session strictly capped at 100
    totalTeamScore = Math.min(100, Math.max(...participantScores.map((p) => p.finalScore), 0));

    return {
      success: true,
      totalTeamScore,
      participantScores,
      completionTimeMs: elapsedMs,
      isPerfect,
      summary: `Game ${input.gameType} diselesaikan dalam ${(elapsedMs / 1000).toFixed(1)}s dengan total skor tim ${totalTeamScore} pts.`,
    };
  }
}
