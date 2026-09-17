import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { db } from "./index";
import { ormawaBooths, users } from "./schema";

export const DEFAULT_ORMAWA_PIC_PASSWORD = "ormawa2026";

export const OFFICIAL_ORMAWA_PIC_ACCOUNTS = [
  { boothCode: "ORMAWA-INFORMATIKA", username: "informatikaunu" },
  { boothCode: "ORMAWA-HMTE", username: "hmteunu" },
  { boothCode: "ORMAWA-MANAJEMEN", username: "manajemenunu" },
  { boothCode: "ORMAWA-HIMATANSI", username: "himatansiunu" },
  { boothCode: "ORMAWA-HIMAFAR", username: "himafarunu" },
  { boothCode: "ORMAWA-THP", username: "thpunu" },
  { boothCode: "ORMAWA-AGRIBISNIS", username: "agribisnisunu" },
  { boothCode: "ORMAWA-PGSD", username: "pgsdunu" },
  { boothCode: "ORMAWA-PBI", username: "pbiunu" },
  { boothCode: "ORMAWA-SII", username: "siiunu" },
  { boothCode: "ORMAWA-JQH", username: "jqhunu" },
  { boothCode: "ORMAWA-MUSIK", username: "musikunu" },
  { boothCode: "ORMAWA-KSR", username: "ksrunu" },
  { boothCode: "ORMAWA-BADMINTON", username: "badmintonunu" },
  { boothCode: "ORMAWA-SILAT", username: "silatunu" },
  { boothCode: "ORMAWA-PADUS", username: "padusunu" },
  { boothCode: "ORMAWA-FASHION", username: "fashionunu" },
  { boothCode: "ORMAWA-MAPALA", username: "mapalaunu" },
  { boothCode: "ORMAWA-TARI", username: "tariunu" },
  { boothCode: "ORMAWA-VOLLY", username: "vollyunu" },
] as const;

type EnsureOrmawaPicOptions = {
  resetPasswords?: boolean;
};

/**
 * Membuat akun PIC resmi secara idempotent dan memastikan setiap akun hanya
 * terhubung ke satu stan resmi. Aman dijalankan pada database yang sudah berisi
 * transaksi karena tidak menghapus akun peserta, stan, scan, atau skor.
 */
export async function ensureOfficialOrmawaPics(
  options: EnsureOrmawaPicOptions = {},
) {
  let created = 0;
  let updated = 0;
  let linked = 0;
  const missingBooths: string[] = [];

  for (const account of OFFICIAL_ORMAWA_PIC_ACCOUNTS) {
    const password = `${account.username}2026`;
    const passwordHash = await hashPassword(password);

    const [booth] = await db
      .select()
      .from(ormawaBooths)
      .where(eq(ormawaBooths.code, account.boothCode))
      .limit(1);

    if (!booth) {
      missingBooths.push(account.boothCode);
      continue;
    }

    const fullName = `PIC ${booth.shortName || booth.name}`;
    const [existingPic] = await db
      .select()
      .from(users)
      .where(eq(users.username, account.username))
      .limit(1);

    let pic = existingPic;
    if (!pic) {
      [pic] = await db
        .insert(users)
        .values({
          username: account.username,
          passwordHash,
          fullName,
          role: "ORMAWA_PIC",
          status: "ACTIVE",
          gender: "MALE",
          characterClass: "CYBER_KNIGHT",
          characterTitle: "Ormawa PIC",
          characterTier: 1,
          unlockedTitles: ["Novice Adventurer"],
        })
        .returning();
      created++;
    } else {
      const changes: Record<string, unknown> = {
        fullName,
        role: "ORMAWA_PIC",
        status: "ACTIVE",
        passwordHash, // Selalu perbarui agar match dengan password simple username2026
        updatedAt: new Date(),
      };

      [pic] = await db
        .update(users)
        .set(changes)
        .where(eq(users.id, existingPic.id))
        .returning();
      updated++;
    }

    // Hindari satu akun PIC terhubung ke booth lama dan booth resmi sekaligus.
    await db
      .update(ormawaBooths)
      .set({ picUserId: null })
      .where(eq(ormawaBooths.picUserId, pic.id));

    await db
      .update(ormawaBooths)
      .set({ picUserId: pic.id })
      .where(eq(ormawaBooths.id, booth.id));
    linked++;
  }

  return { created, updated, linked, missingBooths };
}

if (import.meta.main) {
  ensureOfficialOrmawaPics({ resetPasswords: true })
    .then((result) => {
      console.log("✅ Akun PIC Ormawa siap:", result);
      console.log(`🔑 Password default: ${DEFAULT_ORMAWA_PIC_PASSWORD}`);
      process.exit(result.missingBooths.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("❌ Gagal menyiapkan akun PIC Ormawa:", error);
      process.exit(1);
    });
}
