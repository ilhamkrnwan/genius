import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ORMAWA_PIC_PASSWORD,
  OFFICIAL_ORMAWA_PIC_ACCOUNTS,
} from "../src/db/ensure-ormawa-pics";

describe("official Ormawa PIC accounts", () => {
  test("defines one unique account for every official booth", () => {
    expect(OFFICIAL_ORMAWA_PIC_ACCOUNTS).toHaveLength(19);
    expect(new Set(OFFICIAL_ORMAWA_PIC_ACCOUNTS.map((item) => item.boothCode)).size).toBe(19);
    expect(new Set(OFFICIAL_ORMAWA_PIC_ACCOUNTS.map((item) => item.username)).size).toBe(19);
  });

  test("keeps the documented Pagar Nusa demo credential", () => {
    expect(OFFICIAL_ORMAWA_PIC_ACCOUNTS).toContainEqual({
      boothCode: "ORMAWA-SILAT",
      username: "pic-pagar-nusa",
    });
    expect(DEFAULT_ORMAWA_PIC_PASSWORD).toBe("genius2026");
  });
});
