import { describe, expect, it } from "bun:test";
import {
  normalizeInstagramUsername,
  ORMAWA_INTEREST_XP,
  ORMAWA_LOGO_MAX_BYTES,
  ORMAWA_STAMP_XP,
  validateOrmawaLogoDataUrl,
} from "../src/domain/ormawa";

describe("aturan domain Ormawa", () => {
  it("menggunakan ekonomi XP tanpa batas stan global", () => {
    expect(ORMAWA_STAMP_XP).toBe(2);
    expect(ORMAWA_INTEREST_XP).toBe(3);
  });

  it("menormalisasi handle Instagram dari handle maupun URL", () => {
    expect(normalizeInstagramUsername("@silat_unujogja")).toBe("silat_unujogja");
    expect(normalizeInstagramUsername("https://instagram.com/silat.unu/" )).toBe("silat.unu");
    expect(normalizeInstagramUsername("nama tidak valid")).toBeNull();
  });

  it("menerima format logo yang didukung dan menolak file lebih dari 2 MB", () => {
    expect(validateOrmawaLogoDataUrl("data:image/png;base64,aGVsbG8=" )).toBeNull();
    const oversizedBase64 = "A".repeat(Math.ceil((ORMAWA_LOGO_MAX_BYTES + 1) * 4 / 3));
    expect(validateOrmawaLogoDataUrl(`data:image/png;base64,${oversizedBase64}`)).toBe("Ukuran logo maksimal 2 MB.");
    expect(validateOrmawaLogoDataUrl("https://example.com/logo.png")).toBe("Logo harus berupa file PNG, JPG, atau WebP.");
  });
});
