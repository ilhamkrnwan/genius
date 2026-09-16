import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { db } from "./index";
import { ormawaBooths, users } from "./schema";

export const DEFAULT_ORMAWA_PIC_PASSWORD = "genius2026";

export const OFFICIAL_ORMAWA_PIC_ACCOUNTS = [
  { boothCode: "ORMAWA-HMTE", username: "pic-hmte" },
  { boothCode: "ORMAWA-HIMAFAR", username: "pic-himafar" },
  { boothCode: "ORMAWA-MUSIK", username: "pic-musik" },
  { boothCode: "ORMAWA-HIMASII", username: "pic-himasii" },
  { boothCode: "ORMAWA-PADUS", username: "pic-padus" },
  { boothCode: "ORMAWA-HIMATIKA", username: "pic-himatika" },
  { boothCode: "ORMAWA-HIMAGRI", username: "pic-himagri" },
  { boothCode: "ORMAWA-HMP-THP", username: "pic-hmp-thp" },
  { boothCode: "ORMAWA-HIMATANSI", username: "pic-himatansi" },
  { boothCode: "ORMAWA-JQH-IAC", username: "pic-jqh-iac" },
  { boothCode: "ORMAWA-BADMINTON", username: "pic-badminton" },
  { boothCode: "ORMAWA-MAPALA", username: "pic-mapala" },
  { boothCode: "ORMAWA-SILAT", username: "pic-pagar-nusa" },
  { boothCode: "ORMAWA-TARI", username: "pic-tari" },
  { boothCode: "ORMAWA-HIMA-PGSD", username: "pic-hima-pgsd" },
  { boothCode: "ORMAWA-HMP-PBI", username: "pic-hmp-pbi" },
  { boothCode: "ORMAWA-KSR", username: "pic-ksr" },
  { boothCode: "ORMAWA-PERMASUM", username: "pic-permasum" },
  { boothCode: "ORMAWA-HMPM", username: "pic-hmpm" },
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
  const passwordHash = await hashPassword(DEFAULT_ORMAWA_PIC_PASSWORD);
  let created = 0;
  let updated = 0;
  let linked = 0;
  const missingBooths: string[] = [];

  for (const account of OFFICIAL_ORMAWA_PIC_ACCOUNTS) {
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
        updatedAt: new Date(),
      };
      if (options.resetPasswords) changes.passwordHash = passwordHash;

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
