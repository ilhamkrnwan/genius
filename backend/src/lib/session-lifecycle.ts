export type SessionStatus = "PENDING" | "READY" | "ACTIVE" | "PAUSED" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export const ACTIVE_SESSION_STATUSES: SessionStatus[] = ["READY", "ACTIVE", "PAUSED"];

export function canStartSession(status: SessionStatus) {
  return status === "READY" || status === "PAUSED";
}

export function canPauseSession(status: SessionStatus) {
  return status === "ACTIVE";
}

export function canCompleteSession(status: SessionStatus) {
  return status === "READY" || status === "ACTIVE" || status === "PAUSED";
}

export function canCancelOrExpireSession(status: SessionStatus) {
  return ACTIVE_SESSION_STATUSES.includes(status);
}

export function pausedDurationMs(metadata: Record<string, unknown> | null | undefined, nowMs: number) {
  const stored = Number(metadata?.pausedDurationMs || 0);
  const pausedAt = typeof metadata?.pausedAt === "string" ? Date.parse(metadata.pausedAt) : NaN;
  return stored + (Number.isFinite(pausedAt) ? Math.max(0, nowMs - pausedAt) : 0);
}

export function hasSessionTimedOut(
  serverStartAt: Date | null | undefined,
  timeLimitSeconds: number | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
  nowMs = Date.now(),
) {
  if (!serverStartAt || !timeLimitSeconds || timeLimitSeconds <= 0) return false;
  return nowMs - serverStartAt.getTime() - pausedDurationMs(metadata, nowMs) >= timeLimitSeconds * 1000;
}
