import { resolve } from "path";
import { db } from "../src/db";
import { users, teams, teamMembers } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";
import { eq } from "drizzle-orm";

const BUDDY_CSV_PATH = resolve(import.meta.dir, "../../buddy.csv");

async function updateBuddyCredentials() {
  console.log("================================================================================");
  console.log("👥 UPDATE KREDENSIAL BUDDY: USERNAME NIM & PASSWORD NAMA KELOMPOK");
  console.log("================================================================================\n");

  const file = Bun.file(BUDDY_CSV_PATH);
  if (!(await file.exists())) {
    console.error("❌ File buddy.csv tidak ditemukan di:", BUDDY_CSV_PATH);
    process.exit(1);
  }

  const csvText = await file.text();
  const csvLines = csvText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        fullName: parts[0],
        nim: parts[1],
        role: parts[2] || "BUDDY",
      };
    });

  console.log(`📖 Terbaca ${csvLines.length} data Buddy dari buddy.csv.`);

  // Ambil semua Buddy, Teams, dan TeamMembers dari Database
  const dbBuddies = await db.select().from(users).where(eq(users.role, "BUDDY"));
  const allTeams = await db.select().from(teams);
  const allMembers = await db.select().from(teamMembers);

  console.log(`🔍 Ditemukan ${dbBuddies.length} akun Buddy di database.`);

  const updateSummary = [];

  for (const row of csvLines) {
    // Cari buddy berdasarkan nama lengkap (case-insensitive)
    const buddy = dbBuddies.find(
      (b) => b.fullName.toLowerCase().trim() === row.fullName.toLowerCase().trim()
    );

    if (!buddy) {
      console.warn(`⚠️ Buddy '${row.fullName}' tidak ditemukan di tabel users!`);
      continue;
    }

    // Cari penugasan kelompok Buddy
    const memberRel = allMembers.find((m) => m.userId === buddy.id);
    const team = memberRel ? allTeams.find((t) => t.id === memberRel.teamId) : null;

    if (!team) {
      console.warn(`⚠️ Tim untuk Buddy '${buddy.fullName}' tidak ditemukan!`);
      continue;
    }

    // Format password: nama rumah adat lowercase tanpa spasi/simbol + nomor 2 digit
    // Contoh: "Jabu" + "GENIUS-01" -> "jabu01"
    const padNum = team.code.replace("GENIUS-", "").trim();
    const cleanHouseName = team.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const rawPassword = `${cleanHouseName}${padNum}`;

    // Hash password
    const newPasswordHash = await hashPassword(rawPassword);

    // Update username ke NIM dan password_hash ke hash password baru
    await db
      .update(users)
      .set({
        username: row.nim,
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, buddy.id));

    updateSummary.push({
      fullName: buddy.fullName,
      oldUsername: buddy.username,
      newUsername: row.nim,
      teamCode: team.code,
      teamName: team.name,
      password: rawPassword,
    });
  }

  console.log(`\n✅ Berhasil memperbarui ${updateSummary.length} akun Buddy!`);
  console.log("\nSample 5 Akun Pertama:");
  for (const s of updateSummary.slice(0, 5)) {
    console.log(`  - ${s.fullName} ➔ Username: ${s.newUsername} | Password: ${s.password} (${s.teamCode} - ${s.teamName})`);
  }

  console.log("\nSample Akun Khusus:");
  const s20 = updateSummary.find((s) => s.teamCode === "GENIUS-20");
  const s27 = updateSummary.find((s) => s.teamCode === "GENIUS-27");
  if (s20) console.log(`  - ${s20.fullName} ➔ Username: ${s20.newUsername} | Password: ${s20.password} (${s20.teamCode} - ${s20.teamName})`);
  if (s27) console.log(`  - ${s27.fullName} ➔ Username: ${s27.newUsername} | Password: ${s27.password} (${s27.teamCode} - ${s27.teamName})`);

  console.log("\n✨ Selesai memperbarui kredensial Buddy di PostgreSQL.");
  process.exit(0);
}

updateBuddyCredentials().catch((err) => {
  console.error("❌ Terjadi kesalahan saat update kredensial buddy:", err);
  process.exit(1);
});
