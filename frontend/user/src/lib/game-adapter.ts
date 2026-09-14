import type {
  GameDefinition,
  PlayableMission,
  PublicQuestion,
  PublicGameConfig,
  RendererKey,
} from '@genius-unu/shared';
import { normalizePublicQuestion, resolveRendererKey } from '@genius-unu/shared';
import type { Booth, KuisCepatContent, MemoryMatchContent, TebakGambarContent, TebakKataContent } from '@/types/game';

export interface ApiPlayableMission extends Omit<PlayableMission, 'game'> {
  locationCode?: string | null;
  game: GameDefinition & { config: PublicGameConfig };
}

function toLegacyQuestions(questions: PublicQuestion[] = []) {
  return questions.map((question) => ({
    id: question.id,
    text: question.text || (question as any).questionText,
    options: question.options,
    correctAnswerIndex: -1,
    explanation: '',
  }));
}

function buildContent(game: ApiPlayableMission['game'], renderer: RendererKey) {
  const config = game.config || {};
  const questions = toLegacyQuestions(config.questions);

  if (renderer === 'kuis_cepat') {
    return {
      kuisCepatContent: {
        timeLimitSeconds: Number(config.timeLimitSeconds || 18),
        questions,
      } as KuisCepatContent,
    };
  }

  if (renderer === 'memory_match') {
    return {
      memoryMatchContent: {
        pairs: Array.isArray(config.pairs) ? config.pairs : [],
        themeDescription: typeof config.themeDescription === 'string' ? config.themeDescription : undefined,
      } as MemoryMatchContent,
    };
  }

  if (renderer === 'tebak_gambar') {
    return {
      tebakGambarContent: {
        items: Array.isArray(config.items) ? config.items : [],
      } as TebakGambarContent,
    };
  }

  if (renderer === 'tebak_kata') {
    return {
      tebakKataContent: {
        items: Array.isArray(config.items) ? config.items : [],
      } as TebakKataContent,
    };
  }

  if (renderer === 'benar_salah') {
    return {
      benarSalahContent: {
        statements: Array.isArray(config.statements) ? config.statements : [],
      },
    };
  }

  return { questions };
}

export function normalizePlayableMission(mission: ApiPlayableMission): Booth {
  const game = mission.game;
  const renderer = resolveRendererKey(game.type);
  const content = buildContent(game, renderer);

  return {
    id: mission.id,
    floorNumber: mission.floorNumber || 0,
    code: mission.locationCode || mission.locationId,
    name: game.name,
    subtitle: game.description || '',
    type: renderer as Booth['type'],
    tipe_game: renderer as Booth['tipe_game'],
    category: 'umum',
    story: game.instructions || '',
    readingTime: mission.timeLimit ? String(mission.timeLimit) + ' detik' : '',
    iconName: 'GameController',
    stampIcon: 'star',
    stampTitle: game.name,
    stampColor: '#f0d060',
    badgeTag: game.type,
    questions: content.questions || [],
    ...content,
  };
}

export function normalizePlayableSessionMission(
  mission: ApiPlayableMission,
  session: { metadata?: Record<string, any> | null },
): Booth {
  const payload = session.metadata?.gamePayload;
  const payloadConfig = payload?.config || payload;
  const sessionMission = payloadConfig
    ? { ...mission, game: { ...mission.game, config: { ...mission.game.config, ...payloadConfig } } }
    : mission;
  return normalizePlayableMission(sessionMission);
}

export function sanitizePublicQuestions(questions: Array<PublicQuestion | Record<string, unknown>>) {
  return questions.map((question) => normalizePublicQuestion(question as PublicQuestion));
}
