import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ORMAWA_PIC_PASSWORD,
  OFFICIAL_ORMAWA_PIC_ACCOUNTS,
} from "../src/db/ensure-ormawa-pics";

describe("official Ormawa PIC accounts", () => {
  test("defines one unique account for every official booth", () => {
    expect(OFFICIAL_ORMAWA_PIC_ACCOUNTS).toHaveLength(20);
    expect(new Set(OFFICIAL_ORMAWA_PIC_ACCOUNTS.map((item) => item.boothCode)).size).toBe(20);
    expect(new Set(OFFICIAL_ORMAWA_PIC_ACCOUNTS.map((item) => item.username)).size).toBe(20);
  });

  test("contains standard simple credentials for HMTE and Silat", () => {
    expect(OFFICIAL_ORMAWA_PIC_ACCOUNTS).toContainEqual({
      boothCode: "ORMAWA-SILAT",
      username: "silatunu",
    });
    expect(OFFICIAL_ORMAWA_PIC_ACCOUNTS).toContainEqual({
      boothCode: "ORMAWA-HMTE",
      username: "hmteunu",
    });
    expect(DEFAULT_ORMAWA_PIC_PASSWORD).toBe("ormawa2026");
  });
});
