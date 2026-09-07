import { describe, expect, it } from "bun:test";
import {
  canCancelOrExpireSession,
  canCompleteSession,
  canPauseSession,
  canStartSession,
  hasSessionTimedOut,
  pausedDurationMs,
} from "../src/lib/session-lifecycle";

describe("Game session lifecycle contract", () => {
  it("allows only valid start and pause transitions", () => {
    expect(canStartSession("READY")).toBe(true);
    expect(canStartSession("PAUSED")).toBe(true);
    expect(canStartSession("ACTIVE")).toBe(false);
    expect(canPauseSession("ACTIVE")).toBe(true);
    expect(canPauseSession("READY")).toBe(false);
  });

  it("allows completion and operational cleanup only for live states", () => {
    expect(canCompleteSession("READY")).toBe(true);
    expect(canCompleteSession("ACTIVE")).toBe(true);
    expect(canCompleteSession("PAUSED")).toBe(true);
    expect(canCompleteSession("COMPLETED")).toBe(false);
    expect(canCancelOrExpireSession("ACTIVE")).toBe(true);
    expect(canCancelOrExpireSession("COMPLETED")).toBe(false);
  });

  it("counts only active time when a session is paused", () => {
    const now = Date.parse("2026-09-06T10:00:20.000Z");
    const metadata = {
      pausedAt: "2026-09-06T10:00:10.000Z",
      pausedDurationMs: 2_000,
    };
    expect(pausedDurationMs(metadata, now)).toBe(12_000);
    expect(hasSessionTimedOut(new Date("2026-09-06T09:59:00.000Z"), 90, metadata, now)).toBe(false);
    expect(hasSessionTimedOut(new Date("2026-09-06T09:58:00.000Z"), 90, metadata, now)).toBe(true);
  });
});
