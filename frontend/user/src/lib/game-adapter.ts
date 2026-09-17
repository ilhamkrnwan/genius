import type {
  GameDefinition,
  PlayableMission,
  PublicQuestion,
  PublicGameConfig,
  RendererKey,
} from '@genius-unu/shared';
import { normalizePublicQuestion, resolveRendererKey } from '@genius-unu/shared';
import type { Booth, KuisCepatContent, MemoryMatchContent, TebakGambarContent, TebakKataContent } from '@/types/game';
import { BOOTHS_DATA } from '@/data/mockData';

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
  const config = (game.config || {}) as Record<string, any>;
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

  if (renderer === 'tts') {
    return {
      ttsContent: config.ttsContent || {
        gridSize: config.gridSize || { cols: 8, rows: 14 },
        clues: Array.isArray(config.clues) ? config.clues : [],
      },
    };
  }

  if (renderer === 'benar_salah') {
    return {
      benarSalahContent: config.benarSalahContent || {
        statements: Array.isArray(config.statements) ? config.statements : [],
      },
    };
  }

  if (renderer === 'tebak_posisi') {
    return {
      tebakPosisiContent: config.tebakPosisiContent || {
        items: Array.isArray(config.items) ? config.items : [],
      },
    };
  }
  return { questions };
}

const OFFICIAL_LOCATION_ALIAS_MAP: Record<string, string> = {
  'POS-L1-1': 'booth-1a',
  'POS-L2-2': 'booth-2a',
  'POS-L3-3': 'booth-3a',
  'POS-L4-4': 'booth-4a',
  'POS-L5-5': 'booth-5a',
  'POS-L2-6': 'booth-2b',
  'POS-L6-7': 'booth-6a',
  'POS-L6-8': 'booth-6b',
  'POS-L4-9': 'booth-4b',
  'BOOTH-1': 'booth-1a',
  'BOOTH-2': 'booth-2a',
  'BOOTH-3': 'booth-3a',
  'BOOTH-4': 'booth-4a',
  'BOOTH-5': 'booth-5a',
  'BOOTH-6': 'booth-2b',
  'BOOTH-7': 'booth-6a',
  'BOOTH-8': 'booth-6b',
  'BOOTH-9': 'booth-4b',
};

export function normalizePlayableMission(mission: ApiPlayableMission): Booth {
  const game = mission.game;
  const renderer = resolveRendererKey(game.type);
  const content = buildContent(game, renderer) as Record<string, any>;

  const locCode = (mission.locationCode || '').toUpperCase();
  const mappedId = OFFICIAL_LOCATION_ALIAS_MAP[locCode];

  const localTemplate =
    (locCode && BOOTHS_DATA[locCode]) ||
    (mappedId && BOOTHS_DATA[mappedId]) ||
    BOOTHS_DATA[mission.id] ||
    Object.values(BOOTHS_DATA).find(
      (b) =>
        b.code?.toUpperCase() === locCode ||
        b.id?.toLowerCase() === locCode.toLowerCase() ||
        (mappedId && b.id === mappedId) ||
        b.id === mission.id
    ) ||
    null;

  return {
    ...(localTemplate || {}),
    id: localTemplate?.id || mappedId || mission.id,
    missionId: mission.id,
    floorNumber: mission.floorNumber || localTemplate?.floorNumber || 0,
    code: mission.locationCode || localTemplate?.code || mission.locationId,
    name: game.name || localTemplate?.name || '',
    subtitle: game.description || localTemplate?.subtitle || '',
    type: (localTemplate?.type || renderer) as Booth['type'],
    tipe_game: (localTemplate?.tipe_game || renderer) as Booth['tipe_game'],
    category: localTemplate?.category || 'umum',
    story: localTemplate?.story || game.instructions || '',
    readingTime: mission.timeLimit ? String(mission.timeLimit) + ' detik' : (localTemplate?.readingTime || ''),
    iconName: localTemplate?.iconName || 'GameController',
    stampIcon: localTemplate?.stampIcon || 'star',
    stampTitle: localTemplate?.stampTitle || game.name,
    stampColor: localTemplate?.stampColor || '#f0d060',
    badgeTag: game.type || localTemplate?.badgeTag,
    ...content,
    questions: content.questions?.length ? content.questions : (localTemplate?.questions || []),
    ...(localTemplate?.ttsContent?.clues?.length && !content.ttsContent?.clues?.length
      ? { ttsContent: localTemplate.ttsContent }
      : {}),
    ...(localTemplate?.benarSalahContent?.statements?.length && !content.benarSalahContent?.statements?.length
      ? { benarSalahContent: localTemplate.benarSalahContent }
      : {}),
    ...(localTemplate?.tebakKataContent?.items?.length && !content.tebakKataContent?.items?.length
      ? { tebakKataContent: localTemplate.tebakKataContent }
      : {}),
    ...(localTemplate?.tebakPosisiContent?.items?.length && !content.tebakPosisiContent?.items?.length
      ? { tebakPosisiContent: localTemplate.tebakPosisiContent }
      : {}),
    ...(localTemplate?.tebakGambarContent?.items?.length && !content.tebakGambarContent?.items?.length
      ? { tebakGambarContent: localTemplate.tebakGambarContent }
      : {}),
    ...(localTemplate?.memoryMatchContent?.pairs?.length && !content.memoryMatchContent?.pairs?.length
      ? { memoryMatchContent: localTemplate.memoryMatchContent }
      : {}),
    ...(localTemplate?.kuisCepatContent?.questions?.length && !content.kuisCepatContent?.questions?.length
      ? { kuisCepatContent: localTemplate.kuisCepatContent }
      : {}),
  } as Booth;
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
