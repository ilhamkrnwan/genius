import { resolve } from "path";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

async function updateMabaPasswords() {
  console.log("🔐 [1/3] Membaca data tanggal lahir dari maba_2026.csv...");
  const csvPath = resolve(import.meta.dir, "../../maba_2026.csv");
  const mabaFile = Bun.file(csvPath);
  if (!(await mabaFile.exists())) {
    throw new Error(`File CSV tidak ditemukan di: ${csvPath}`);
  }

  const mabaCsvText = await mabaFile.text();
  const mabaLines = mabaCsvText.trim().split(/\r?\n/).filter(Boolean);
  const headers = mabaLines[0].split(",").map((h) => h.replace(/["\r]/g, "").trim());
  const uIdx = headers.indexOf("username");
  const pwIdx = headers.indexOf("password_hash");
  const fnIdx = headers.indexOf("full_name");
  const gIdx = headers.indexOf("gender");

  const participants = mabaLines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
      c.replace(/^"|"$/g, "").trim()
    );
    const rawPw = cols[pwIdx] || "genius2026";
    const cleanPw = rawPw.toLowerCase().replace(/\s+/g, "");
    return {
      username: cols[uIdx],
      fullName: cols[fnIdx],
      gender: cols[gIdx],
      rawPw,
      cleanPw,
    };
  });

  console.log(`  ✅ Terbaca ${participants.length} maba dari CSV.`);

  console.log("⚡ [2/3] Melakukan hashing password tanggal lahir (huruf kecil & tanpa spasi)...");
  console.time("Hash & Update DB");

  // Cache hashes for identical birth dates to optimize CPU
  const hashCache = new Map<string, string>();
  let updatedCount = 0;

  for (const p of participants) {
    let passwordHash = hashCache.get(p.cleanPw);
    if (!passwordHash) {
      passwordHash = await Bun.password.hash(p.cleanPw, { algorithm: "bcrypt", cost: 10 });
      hashCache.set(p.cleanPw, passwordHash);
    }

    const avatarUrl = p.gender?.toUpperCase() === "FEMALE" ? "/character-cewek.avif" : "/character-cowok.avif";

    await db
      .update(users)
      .set({
        passwordHash,
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(and(eq(users.username, p.username), eq(users.role, "PARTICIPANT")));

    updatedCount++;
  }

  console.timeEnd("Hash & Update DB");
  console.log(`  ✅ Berhasil mengupdate ${updatedCount} akun mahasiswa baru di database!`);

  console.log("\n🧪 [3/3] Pengujian verifikasi login sampel...");
  const samples = [
    participants[0], // Wahyu Farid Raharjo (26mei2006)
    participants[1], // Fahri Kurniawan (16juli2007)
    participants[4], // Elvirda Aulia (25april2008)
    participants[6], // Alya Khoirun Nisa (8januari2005)
  ];

  for (const s of samples) {
    const [u] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, s.username), eq(users.role, "PARTICIPANT")));

    if (!u) {
      console.error(`❌ User ${s.username} tidak ditemukan!`);
      continue;
    }

    const valid = await Bun.password.verify(s.cleanPw, u.passwordHash);
    console.log(
      `  • ${s.fullName} (NIM: ${s.username}) | Pass: "${s.cleanPw}" ➔ Login test: ${
        valid ? "✅ SUKSES" : "❌ GAGAL"
      }`
    );
  }

  console.log("\n🎉 Seluruh password mahasiswa baru telah berhasil diperbarui!");
  process.exit(0);
}

updateMabaPasswords().catch((err) => {
  console.error(err);
  process.exit(1);
});
