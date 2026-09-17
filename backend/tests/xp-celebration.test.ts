import { describe, it, expect } from "bun:test";
import { broadcastXpCelebration, type XpCelebrationPayload } from "../src/realtime";

describe("XP Celebration Real-Time Broadcaster", () => {
  it("broadcasts attendance celebration payload safely", () => {
    const payload: XpCelebrationPayload = {
      type: "ATTENDANCE_IN",
      title: "Presensi Masuk Hari 1",
      giverName: "Agnes Anggraini Risdiyanto",
      giverRole: "Buddy Pendamping",
      xp: 100,
      totalXp: 100,
      message: "Presensi masuk Tepat Waktu berhasil dicatat!",
      icon: "CheckCircle",
    };

    expect(() => {
      broadcastXpCelebration("test-maba-uuid-1", payload);
    }).not.toThrow();
  });

  it("broadcasts FGD celebration payload safely", () => {
    const payload: XpCelebrationPayload = {
      type: "FGD",
      title: "Evaluasi FGD-1",
      giverName: "Agnesya Putri Triyana",
      giverRole: "Game Master Buddy",
      xp: 150,
      message: "Nilai FGD berhasil diberikan (15/15 pts)!",
      icon: "Sparkle",
    };

    expect(() => {
      broadcastXpCelebration("test-maba-uuid-2", payload);
    }).not.toThrow();
  });

  it("broadcasts Day-3 and Ormawa celebration payloads safely", () => {
    const day3Payload: XpCelebrationPayload = {
      type: "DAY_3",
      title: "Penilaian Hari Ke-3",
      giverName: "Ahmad Fadlil Munajad",
      giverRole: "Game Master Buddy",
      xp: 200,
      icon: "Trophy",
    };

    const ormawaPayload: XpCelebrationPayload = {
      type: "ORMAWA",
      title: "Stan HMP INFORMATIKA",
      giverName: "HMP INFORMATIKA",
      giverRole: "Stan Ormawa / UKM Expo",
      xp: 75,
      icon: "Stamp",
    };

    expect(() => {
      broadcastXpCelebration("test-maba-uuid-3", day3Payload);
      broadcastXpCelebration("test-maba-uuid-3", ormawaPayload);
    }).not.toThrow();
  });
});
