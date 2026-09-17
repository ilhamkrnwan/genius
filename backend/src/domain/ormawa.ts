export const ORMAWA_STAMP_XP = 2;
export const ORMAWA_INTEREST_XP = 0;
export const ORMAWA_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function normalizeInstagramUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "")
    .split(/[/?#]/)[0]
    ?.trim();

  if (!value || !/^[A-Za-z0-9._]{1,30}$/.test(value)) return null;
  return value;
}

export function validateOrmawaLogoDataUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return "Logo harus berupa file PNG, JPG, atau WebP.";

  const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
  const decodedBytes = Math.floor((match[2].length * 3) / 4) - padding;
  if (decodedBytes > ORMAWA_LOGO_MAX_BYTES) {
    return "Ukuran logo maksimal 2 MB.";
  }

  return null;
}
