import { resolve } from "path";
import { db } from "../src/db";
import { users, teams, teamMembers, routes } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";
import { eq, inArray } from "drizzle-orm";

// 50 Nama Rumah Tradisional Indonesia untuk 50 Regu GENIUS
const HOUSE_NAMES = [
  "Jabu", "Bolon", "Gadang", "Limas", "Lontik", "Kajang", "Bubung", "Panggung", "Nuwo", "Baduy",
  "Gudang", "Bapang", "Joglo", "Kampung", "Panggang", "Jompongan", "Jolopong", "Julang", "Tagog", "Badak",
  "Capit", "Jubleg", "Tikel", "Baresan", "Crocogan", "Tengger", "Bale", "Lumbung", "Uma", "Omo",
  "Sebua", "Hada", "Betang", "Lamin", "Baloy", "Banjar", "Tambi", "Laika", "Boyang", "Buton",
  "Lego", "Lopo", "Mbaru", "Sao", "Musalaki", "Uma - Sumba", "Honai", "Lopo - Timor", "Baileo", "Sasadu",
];

const CSV_PATH = resolve(import.meta.dir, "../../maba_2026.csv");

function getFacultyByProdi(prodi?: string): string {
  if (!prodi) return "Universitas Nahdlatul Ulama Yogyakarta";
  const p = prodi.toLowerCase();
  if (p.includes("informatika") || p.includes("elektro") || p.includes("komputer")) {
    return "Fakultas Teknologi Informasi";
  }
  if (p.includes("pendidikan") || p.includes("pgsd") || p.includes("inggris")) {
    return "Fakultas Ilmu Pendidikan";
  }
  if (p.includes("agri") || p.includes("pertanian") || p.includes("farmasi") || p.includes("halal") || p.includes("pangan")) {
    return "Fakultas Industri Halal";
  }
  if (p.includes("manajemen") || p.includes("akuntansi") || p.includes("bisnis") || p.includes("ekonomi")) {
    return "Fakultas Ekonomi & Bisnis";
  }
  if (p.includes("islam") || p.includes("syariah") || p.includes("agama")) {
    return "Fakultas Studi Islam";
  }
  return "Universitas Nahdlatul Ulama Yogyakarta";
}

async function runSeedMabaAndTeams() {
  console.log("================================================================================");
  console.log("🌱 SEEDING RESMI MAHASISWA BARU 2026 & REORGANISASI 50 REGU GENIUS");
  console.log("================================================================================\n");

  // 1. Baca dan validasi CSV
  console.log("📖 [1/5] Membaca file CSV:", CSV_PATH);
  const file = Bun.file(CSV_PATH);
  if (!(await file.exists())) {
    console.error("❌ File CSV tidak ditemukan di:", CSV_PATH);
    process.exit(1);
  }

  const rawText = await file.text();
  const lines = rawText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    console.error("❌ File CSV kosong atau hanya header.");
    process.exit(1);
  }

  const headers = lines[0].split(",").map((h) => h.replace(/["\r]/g, "").trim());
  const usernameIdx = headers.indexOf("username");
  const fullNameIdx = headers.indexOf("full_name");
  const genderIdx = headers.indexOf("gender");
  const prodiIdx = headers.indexOf("prodi");

  const parsedParticipants = lines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
      c.replace(/^"|"$/g, "").trim()
    );
    const rawProdi = prodiIdx !== -1 ? cols[prodiIdx] : undefined;
    const gender = (cols[genderIdx]?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE";
    return {
      username: cols[usernameIdx],
      fullName: cols[fullNameIdx],
      gender,
      prodi: rawProdi,
      faculty: getFacultyByProdi(rawProdi),
    };
  });

  console.log(`  ✅ Terbaca ${parsedParticipants.length} mahasiswa dari CSV.`);

  // 2. Identifikasi Peserta Khusus
  const tazkiyah = parsedParticipants.find((p) => p.fullName.toUpperCase().includes("TAZKIYAH NUR ASHIFA"));
  const vina = parsedParticipants.find((p) => p.fullName.toUpperCase().includes("VINA SUGIARTI"));

  if (!tazkiyah || !vina) {
    console.error("❌ Mahasiswa khusus (TAZKIYAH NUR ASHIFA / VINA SUGIARTI) tidak ditemukan di CSV!");
    process.exit(1);
  }

  console.log("  🎯 Mahasiswa Khusus Teridentifikasi:");
  console.log(`     - ${tazkiyah.fullName} (NIM: ${tazkiyah.username}, Kebutuhan Khusus: Autoimun Lupus)`);
  console.log(`     - ${vina.fullName} (NIM: ${vina.username}, Kebutuhan Khusus: Tuna Rungu)`);

  // 3. Masukkan / Upsert Akun Mahasiswa Baru ke DB
  console.log("\n🔐 [2/5] Menyiapkan kredensial default ('genius2026') & avatar AVIF...");
  const defaultPasswordHash = await hashPassword("genius2026");

  const usersToInsert = parsedParticipants.map((p) => ({
    username: p.username,
    fullName: p.fullName,
    passwordHash: defaultPasswordHash,
    role: "PARTICIPANT" as const,
    status: "ACTIVE" as const,
    gender: p.gender,
    faculty: p.faculty,
    prodi: p.prodi,
    characterClass: "CYBER_KNIGHT",
    characterTitle: "Novice Adventurer",
    characterTier: 1,
    unlockedTitles: ["Novice Adventurer"],
    avatarUrl: p.gender === "FEMALE" ? "/character-cewek.avif" : "/character-cowok.avif",
  }));

  console.log(`🚀 [3/5] Memasukkan ${usersToInsert.length} Mahasiswa Baru ke tabel users...`);
  const batchSize = 100;
  for (let i = 0; i < usersToInsert.length; i += batchSize) {
    const batch = usersToInsert.slice(i, i + batchSize);
    await db.insert(users).values(batch).onConflictDoNothing();
  }

  // Ambil data users partisipan yang tersimpan di DB
  const participantUsernames = parsedParticipants.map((p) => p.username);
  const dbParticipants = await db
    .select()
    .from(users)
    .where(inArray(users.username, participantUsernames));

  console.log(`  ✅ Berhasil memverifikasi ${dbParticipants.length} partisipan aktif di PostgreSQL.`);

  // 4. Verifikasi 50 Buddies & 50 Teams
  console.log("\n👥 [4/5] Mengatur 50 Regu GENIUS & 50 Buddy (Semua PRIMARY, Tanpa Ketua Regu)...");

  // Ambil buddy01 - buddy50
  const allBuddies = await db.select().from(users).where(eq(users.role, "BUDDY"));
  allBuddies.sort((a, b) => a.username.localeCompare(b.username));

  if (allBuddies.length < 50) {
    console.error(`❌ Jumlah Buddy di DB hanya ${allBuddies.length}, diperlukan 50 Buddy.`);
    process.exit(1);
  }

  // Cari buddy khusus
  const buddyKhoirunnisa = allBuddies.find((b) => b.fullName.toLowerCase().includes("khoirunnisa"));
  const buddyMutiara = allBuddies.find((b) => b.fullName.toLowerCase().includes("mutiara"));

  if (!buddyKhoirunnisa || !buddyMutiara) {
    console.error("❌ Buddy Khoirunnisa atau Mutiara tidak ditemukan di tabel users!");
    process.exit(1);
  }

  console.log(`  🎯 Buddy Khusus Teridentifikasi:`);
  console.log(`     - Khoirunnisa Aulia Rahmah: ${buddyKhoirunnisa.username} (ID: ${buddyKhoirunnisa.id})`);
  console.log(`     - Mutiara Nisa Cahya Kusuma: ${buddyMutiara.username} (ID: ${buddyMutiara.id})`);

  // Ambil route utama (jika ada)
  const [mainRoute] = await db.select().from(routes).limit(1);

  // Buat / Pastikan 50 Teams ada
  const dbTeams = [];
  for (let i = 0; i < 50; i++) {
    const code = `GENIUS-${String(i + 1).padStart(2, "0")}`;
    const name = HOUSE_NAMES[i] || `Regu ${i + 1}`;

    const [existing] = await db.select().from(teams).where(eq(teams.code, code)).limit(1);
    if (!existing) {
      const [newTeam] = await db
        .insert(teams)
        .values({
          code,
          name,
          captainId: null, // Aturan: TIDAK ADA KETUA REGU
          routeId: mainRoute?.id || null,
          status: "ACTIVE",
        })
        .returning();
      dbTeams.push(newTeam);
    } else {
      // Pastikan captainId selalu null dan nama sesuai
      await db
        .update(teams)
        .set({
          name,
          captainId: null, // Aturan: TIDAK ADA KETUA REGU
          routeId: mainRoute?.id || null,
        })
        .where(eq(teams.id, existing.id));
      dbTeams.push({ ...existing, name, captainId: null });
    }
  }

  // Bersihkan seluruh keanggotaan teamMembers lama agar fresh slate
  console.log("  🧹 Membersihkan teamMembers lama...");
  await db.delete(teamMembers);

  // Pasangkan 50 Buddy ke masing-masing 50 Regu: 1 Regu = 1 Buddy (PRIMARY)
  // GENIUS-01 -> buddy01, ..., GENIUS-20 -> buddy20, ..., GENIUS-27 -> buddy27, ..., GENIUS-50 -> buddy50
  const buddyMembersToInsert = [];
  for (let i = 0; i < 50; i++) {
    const team = dbTeams[i];
    const buddy = allBuddies[i]; // buddy01 s/d buddy50
    buddyMembersToInsert.push({
      teamId: team.id,
      userId: buddy.id,
      buddyRole: "PRIMARY" as const, // Aturan: SEMUA BUDDY PRIMARY
      isCaptain: false,
    });
  }
  await db.insert(teamMembers).values(buddyMembersToInsert);
  console.log(`  ✅ 50 Buddy berhasil ditugaskan sebagai PRIMARY ke 50 Regu (GENIUS-01 s/d GENIUS-50).`);

  // 5. Distribusi 403 Peserta ke 50 Regu dengan Pasangan Khusus
  console.log("\n📦 [5/5] Mendistribusikan 403 Peserta ke 50 Regu...");

  // Temukan objek DB untuk peserta khusus
  const dbTazkiyah = dbParticipants.find((p) => p.username === tazkiyah.username)!;
  const dbVina = dbParticipants.find((p) => p.username === vina.username)!;

  // Temukan tim untuk Buddy Khoirunnisa dan Buddy Mutiara
  // Khoirunnisa adalah buddy20 -> Team index 19 (GENIUS-20)
  // Mutiara adalah buddy27 -> Team index 26 (GENIUS-27)
  const teamKhoirunnisa = dbTeams.find((_, idx) => allBuddies[idx].id === buddyKhoirunnisa.id)!;
  const teamMutiara = dbTeams.find((_, idx) => allBuddies[idx].id === buddyMutiara.id)!;

  console.log(`     -> Menempatkan TAZKIYAH NUR ASHIFA ke Regu ${teamKhoirunnisa.code} (${teamKhoirunnisa.name}) bersama Buddy Khoirunnisa`);
  console.log(`     -> Menempatkan VINA SUGIARTI ke Regu ${teamMutiara.code} (${teamMutiara.name}) bersama Buddy Mutiara`);

  // Susun anggota per tim (50 tim)
  const teamParticipantMap: Map<string, typeof dbParticipants> = new Map();
  for (const t of dbTeams) {
    teamParticipantMap.set(t.id, []);
  }

  // Masukkan peserta khusus terlebih dahulu
  teamParticipantMap.get(teamKhoirunnisa.id)!.push(dbTazkiyah);
  teamParticipantMap.get(teamMutiara.id)!.push(dbVina);

  // Filter 401 peserta lainnya
  const otherParticipants = dbParticipants.filter(
    (p) => p.username !== tazkiyah.username && p.username !== vina.username
  );

  // Target ukuran tim: 403 total -> 3 tim berisi 9 peserta, 47 tim berisi 8 peserta
  // Prioritaskan tim index 0, 1, 2 untuk mendapatkan 9 peserta, sisanya 8 peserta
  const targetSizes = dbTeams.map((_, idx) => (idx < 3 ? 9 : 8));

  let roundRobinIdx = 0;
  for (const p of otherParticipants) {
    while (teamParticipantMap.get(dbTeams[roundRobinIdx].id)!.length >= targetSizes[roundRobinIdx]) {
      roundRobinIdx = (roundRobinIdx + 1) % 50;
    }
    teamParticipantMap.get(dbTeams[roundRobinIdx].id)!.push(p);
    roundRobinIdx = (roundRobinIdx + 1) % 50;
  }

  // Masukkan seluruh anggota partisipan ke tabel teamMembers
  const participantMembersToInsert = [];
  for (const [teamId, pList] of teamParticipantMap.entries()) {
    for (const p of pList) {
      participantMembersToInsert.push({
        teamId,
        userId: p.id,
        buddyRole: null,
        isCaptain: false, // Aturan: TIDAK ADA KETUA REGU
      });
    }
  }

  // Insert per batch (100 rows)
  for (let i = 0; i < participantMembersToInsert.length; i += batchSize) {
    const batch = participantMembersToInsert.slice(i, i + batchSize);
    await db.insert(teamMembers).values(batch);
  }

  console.log(`  ✅ ${participantMembersToInsert.length} Partisipan berhasil dimasukkan ke teamMembers.`);

  // Verifikasi Akhir
  console.log("\n================================================================================");
  console.log("📊 LAPORAN HASIL SEEDING & PENGELOMPOKKAN");
  console.log("================================================================================");
  console.log(`Total Partisipan di DB        : ${dbParticipants.length} mahasiswa`);
  console.log(`Total Regu GENIUS             : ${dbTeams.length} kelompok`);
  console.log(`Total Buddy Terdaftar         : ${allBuddies.length} orang (Semua Role: PRIMARY)`);
  console.log(`Total Keanggotaan TeamMembers : ${50 + participantMembersToInsert.length} (50 Buddy + 403 Maba)`);

  const team20Members = teamParticipantMap.get(teamKhoirunnisa.id)!;
  const team27Members = teamParticipantMap.get(teamMutiara.id)!;

  console.log(`\n📌 Detail Regu Pasangan Khusus:`);
  console.log(`1. Regu ${teamKhoirunnisa.code} - ${teamKhoirunnisa.name}:`);
  console.log(`   - Buddy Pemandu: ${buddyKhoirunnisa.fullName} (${buddyKhoirunnisa.username}) [PRIMARY]`);
  console.log(`   - Total Peserta: ${team20Members.length} Maba`);
  console.log(`   - Ada Tazkiyah : ${team20Members.some((m) => m.username === tazkiyah.username) ? "✅ YA" : "❌ TIDAK"}`);

  console.log(`2. Regu ${teamMutiara.code} - ${teamMutiara.name}:`);
  console.log(`   - Buddy Pemandu: ${buddyMutiara.fullName} (${buddyMutiara.username}) [PRIMARY]`);
  console.log(`   - Total Peserta: ${team27Members.length} Maba`);
  console.log(`   - Ada Vina     : ${team27Members.some((m) => m.username === vina.username) ? "✅ YA" : "❌ TIDAK"}`);

  console.log("\n✨ Selesai dengan sukses tanpa error!");
  process.exit(0);
}

runSeedMabaAndTeams().catch((err) => {
  console.error("❌ Terjadi kesalahan saat eksekusi seed:", err);
  process.exit(1);
});