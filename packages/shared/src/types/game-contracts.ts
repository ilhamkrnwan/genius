export type CanonicalGameType =
  | 'QUIZ'
  | 'MEMORY'
  | 'IMAGE_GUESS'
  | 'PUZZLE'
  | 'REACTION'
  | 'TEAM_CHALLENGE'
  | 'EXPLORATION';

export type GameLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export type RendererKey =
  | 'kuis_cepat'
  | 'memory_match'
  | 'tebak_gambar'
  | 'tebak_kata'
  | 'not_implemented';

export interface GameConfig {
  [key: string]: unknown;
}

export interface PublicGameConfig extends GameConfig {
  questions?: PublicQuestion[];
  timeLimitSeconds?: number;
}

export interface AdminQuestion {
  id: string;
  questionText: string;
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: string[];
  correctAnswer?: string;
  correctAnswerIndex?: number;
  explanation?: string;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

export interface PublicQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface GameDefinition {
  id: string;
  name: string;
  type: CanonicalGameType;
  status: GameLifecycleStatus;
  description?: string | null;
  instructions?: string | null;
  config: GameConfig;
  questionBankCategory?: string | null;
  minPlayers: number;
  maxPlayers: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayableMission {
  id: string;
  name: string;
  description?: string | null;
  game: GameDefinition & { config: PublicGameConfig };
  locationId: string;
  locationName?: string | null;
  floorNumber?: number | null;
  stageId: string;
  timeLimit?: number | null;
  isRequired?: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lockedReason?: string;
}

export type GameSessionStatus =
  | 'PENDING'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface GameSession {
  id: string;
  gameId: string;
  missionId: string;
  teamId: string;
  locationId: string;
  status: GameSessionStatus;
  serverStartAt?: string | null;
  serverEndAt?: string | null;
  timeLimit?: number | null;
  result?: GameResult | null;
  totalScore?: number | null;
  metadata?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnswerSubmission {
  questionId: string;
  answer: string | number | boolean;
  elapsedMs?: number;
  submissionId?: string;
}

export interface GameResult {
  score: number;
  totalQuestions?: number;
  correctAnswers?: number;
  xpEarned?: number;
  completedAt?: string;
}

export interface PlayableValidation {
  playable: boolean;
  reasons: string[];
  checks: {
    validType: boolean;
    validConfig: boolean;
    hasContent: boolean;
    assignedToMission: boolean;
    locationReady: boolean;
    stageReady: boolean;
  };
}

const CANONICAL_TO_RENDERER: Record<CanonicalGameType, RendererKey> = {
  QUIZ: 'kuis_cepat',
  MEMORY: 'memory_match',
  IMAGE_GUESS: 'tebak_gambar',
  PUZZLE: 'tebak_kata',
  REACTION: 'not_implemented',
  TEAM_CHALLENGE: 'not_implemented',
  EXPLORATION: 'not_implemented',
};

const LEGACY_TO_RENDERER: Record<string, RendererKey> = {
  tts: 'not_implemented',
  tebak_kata: 'tebak_kata',
  tebak_posisi: 'tebak_gambar',
  tebak_gambar: 'tebak_gambar',
  kuis_balapan: 'kuis_cepat',
  memory_match: 'memory_match',
  kuis_cepat: 'kuis_cepat',
  benar_salah: 'kuis_cepat',
  kuis: 'kuis_cepat',
};

export function resolveRendererKey(type: string | undefined | null): RendererKey {
  if (!type) return 'not_implemented';
  return CANONICAL_TO_RENDERER[type as CanonicalGameType] || LEGACY_TO_RENDERER[type] || 'not_implemented';
}

export function isCanonicalGameType(type: unknown): type is CanonicalGameType {
  return typeof type === 'string' && type in CANONICAL_TO_RENDERER;
}

export function normalizePublicQuestion(question: PublicQuestion | AdminQuestion): PublicQuestion {
  const candidate = question as PublicQuestion & AdminQuestion;
  return {
    id: candidate.id,
    text: candidate.text || candidate.questionText,
    options: Array.isArray(candidate.options) ? candidate.options : [],
  };
}

export function validateGameDefinition(game: Partial<GameDefinition>): PlayableValidation {
  const validType = isCanonicalGameType(game.type);
  const validConfig = Boolean(game.config && typeof game.config === 'object');
  const questions = (game.config as PublicGameConfig | undefined)?.questions;
  const hasContent = Array.isArray(questions) ? questions.length > 0 : validConfig;
  const reasons: string[] = [];

  if (!validType) reasons.push('Tipe game belum didukung.');
  if (!validConfig) reasons.push('Konfigurasi game tidak valid.');
  if (!hasContent) reasons.push('Content game belum tersedia.');

  return {
    playable: validType && validConfig && hasContent,
    reasons,
    checks: {
      validType,
      validConfig,
      hasContent,
      assignedToMission: false,
      locationReady: false,
      stageReady: false,
    },
  };
}
