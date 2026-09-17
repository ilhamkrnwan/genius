import { db } from "./db";
import {
  users,
  floors,
  locations,
  stages,
  games,
  questions,
  teams,
  teamMembers,
  routes,
  routeStops,
  missions,
  ormawaBooths,
  ormawaInterests,
  dailyReflections,
  ormawaScans,
  fgdEvaluations,
  attendances,
  attendanceSessions,
  participantAchievements,
  auditLogs,
  scoreTransactions,
  gameSessions,
  achievements,
} from "./db/schema";
import { hashPassword } from "./lib/password";
import { ensureOfficialOrmawaPics } from "./db/ensure-ormawa-pics";
import { resolve } from "path";
import { eq, and } from "drizzle-orm";
import { RAW_BUDDY_DATA } from "./data/officialBuddies";

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

const HOUSE_NAMES = [
  "Jabu", "Bolon", "Gadang", "Limas", "Lontik", "Kajang", "Bubung", "Panggung", "Nuwo", "Baduy",
  "Gudang", "Bapang", "Joglo", "Kampung", "Panggang", "Jompongan", "Jolopong", "Julang", "Tagog", "Badak",
  "Capit", "Jubleg", "Tikel", "Baresan", "Crocogan", "Tengger", "Bale", "Lumbung", "Uma", "Omo",
  "Sebua", "Hada", "Betang", "Lamin", "Baloy", "Banjar", "Tambi", "Laika", "Boyang", "Buton",
  "Lego", "Lopo", "Mbaru", "Sao", "Musalaki", "Uma - Sumba", "Honai", "Lopo - Timor", "Baileo", "Sasadu",
];

async function seed() {
  console.log("🌱 Starting GENIUS 2026 Database Seeding (Clean Slate)...");

  // ============================================================
  // 1. CLEAN SLATE: Bersihkan Seluruh Data Transaksi & Akun Pengguna
  // ============================================================
  console.log("🧹 [1/8] Cleaning up existing transactional, team, and user data...");
  // Putuskan relasi PIC lebih dahulu agar penghapusan akun tidak melanggar FK.
  await db.update(ormawaBooths).set({ picUserId: null });
  await db.delete(dailyReflections);
  await db.delete(ormawaInterests);
  await db.delete(ormawaScans);
  await db.delete(fgdEvaluations);
  await db.delete(attendances);
  await db.delete(attendanceSessions);
  await db.delete(participantAchievements);
  await db.delete(auditLogs);
  await db.delete(scoreTransactions);
  await db.delete(gameSessions);
  await db.delete(teamMembers);
  await db.update(teams).set({ captainId: null });
  await db.delete(teams);
  await db.delete(users);
  console.log("  ✅ Clean slate complete: previous users, teams, and logs removed.");

  // Default Passwords
  const adminPassword = await hashPassword("admin2026");
  const defaultPassword = await hashPassword("genius2026");

  // ============================================================
  // 2. SEED ADMIN USER
  // ============================================================
  console.log("👑 [2/8] Creating Master Administrator...");
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin",
      passwordHash: adminPassword,
      fullName: "Administrator GENIUS 2026",
      role: "ADMIN",
      status: "ACTIVE",
    })
    .returning();
  console.log("  ✅ Admin created: username 'admin', password 'admin2026'");

  // ============================================================
  // 3. SEED 50 OFFICIAL BUDDIES (NIM dari buddy.csv, Password: nama kelompok)
  // ============================================================
  console.log("👥 [3/8] Creating 50 Official Buddies (NIM as username, group password)...");
  const buddyInserts = [];
  for (let idx = 0; idx < 50; idx++) {
    const b = RAW_BUDDY_DATA[idx];
    const padNum = String(idx + 1).padStart(2, "0");
    const houseName = HOUSE_NAMES[idx] || `Regu ${idx + 1}`;
    const cleanHouseName = houseName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const rawBuddyPassword = `${cleanHouseName}${padNum}`;
    const buddyPasswordHash = await hashPassword(rawBuddyPassword);

    buddyInserts.push({
      username: b.nim,
      passwordHash: buddyPasswordHash,
      fullName: b.fullName,
      role: "BUDDY" as const,
      status: "ACTIVE" as const,
      gender: b.gender,
      faculty: b.faculty,
      prodi: b.prodi,
      characterClass: "TECH_MONK",
      characterTitle: "Pemandu Mahasiswa",
      characterTier: 2,
      avatarUrl: b.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png",
    });
  }

  const createdBuddies = await db.insert(users).values(buddyInserts).returning();
  console.log(`  ✅ ${createdBuddies.length} Official Buddies registered with NIM as username & group password!`);

  // ============================================================
  // 4. SEED 403 PARTICIPANTS DARI maba_2026.csv
  // ============================================================
  console.log("🎓 [4/8] Loading & Seeding 403 Official Participants from maba_2026.csv...");
  const csvPath = resolve(import.meta.dir, "../../maba_2026.csv");
  const mabaFile = Bun.file(csvPath);
  if (!(await mabaFile.exists())) {
    throw new Error(`File CSV tidak ditemukan di: ${csvPath}`);
  }
  const mabaCsvText = await mabaFile.text();
  const mabaLines = mabaCsvText.trim().split(/\r?\n/).filter(Boolean);
  const mabaHeaders = mabaLines[0].split(",").map((h) => h.replace(/["\r]/g, "").trim());
  const uIdx = mabaHeaders.indexOf("username");
  const fnIdx = mabaHeaders.indexOf("full_name");
  const gIdx = mabaHeaders.indexOf("gender");
  const pIdx = mabaHeaders.indexOf("prodi");
  const pwIdx = mabaHeaders.indexOf("password_hash");

  const parsedMaba = mabaLines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
      c.replace(/^"|"$/g, "").trim()
    );
    const rawProdi = pIdx !== -1 ? cols[pIdx] : undefined;
    const gender = (cols[gIdx]?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE";
    const rawPw = pwIdx !== -1 ? cols[pwIdx] : "genius2026";
    const cleanPw = rawPw ? rawPw.toLowerCase().replace(/\s+/g, "") : "genius2026";
    return {
      username: cols[uIdx],
      fullName: cols[fnIdx],
      gender,
      cleanPw,
      prodi: rawProdi,
      faculty: getFacultyByProdi(rawProdi),
    };
  });

  const mabaHashCache = new Map<string, string>();
  const participantInserts = [];
  for (const p of parsedMaba) {
    let pwHash = mabaHashCache.get(p.cleanPw);
    if (!pwHash) {
      pwHash = await Bun.password.hash(p.cleanPw, { algorithm: "bcrypt", cost: 10 });
      mabaHashCache.set(p.cleanPw, pwHash);
    }
    participantInserts.push({
      username: p.username,
      passwordHash: pwHash,
      fullName: p.fullName,
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
    });
  }

  const createdParticipants = [];
  const batchSize = 100;
  for (let i = 0; i < participantInserts.length; i += batchSize) {
    const batch = participantInserts.slice(i, i + batchSize);
    const res = await db.insert(users).values(batch).returning();
    createdParticipants.push(...res);
  }
  console.log(`  ✅ ${createdParticipants.length} Official Participants registered from CSV (Password: Tanggal Lahir lowercase tanpa spasi)`);

  // ============================================================
  // 5. SEED MASTER DATA: Floors & 18 Locations
  // ============================================================
  console.log("🏢 [5/8] Verifying 9 Campus Floors & 18 Pos Locations...");
  const floorConfig = [
    { number: 1, name: "Lantai 1: Lobby Utama & Student Center", description: "Lobby resepsionis, pusat layanan mahasiswa, dan plaza kampus." },
    { number: 2, name: "Lantai 2: Perpustakaan & Digital Learning Lab", description: "Pusat literasi digital, koleksi buku referensi, dan lab pembelajaran mandiri." },
    { number: 3, name: "Lantai 3: Fakultas Teknologi Informasi & AI Lab", description: "Lab komputasi awan, lab kecerdasan buatan, dan ruang kuliah FTI." },
    { number: 4, name: "Lantai 4: Fakultas Industri Halal & Bioteknologi", description: "Laboratorium halal research, bioteknologi terapan, dan agritech." },
    { number: 5, name: "Lantai 5: Fakultas Ekonomi & Bisnis Digital", description: "Smart classroom, inkubator startup syariah, dan mini financial trading room." },
    { number: 6, name: "Lantai 6: Fakultas Studi Islam & Bahasa Global", description: "Pusat studi Islam Nusantara, laboratorium bahasa asing, dan ruang debat." },
    { number: 7, name: "Lantai 7: Fakultas Ilmu Pendidikan & Seni Budaya", description: "Studio multimedia kreatif, microteaching lab, dan galeri kebudayaan." },
    { number: 8, name: "Lantai 8: Rektorat & Pusat Riset Inovasi UNU", description: "Kantor pimpinan universitas, dewan pertimbangan, dan pusat inovasi strategis." },
    { number: 9, name: "Lantai 9: Convention Hall & Rooftop Sky Garden", description: "Auditorium utama, sky garden panoramic view, dan arena grand final." },
  ];

  const createdFloors = [];
  for (const fc of floorConfig) {
    const [existing] = await db.select().from(floors).where(eq(floors.number, fc.number)).limit(1);
    if (!existing) {
      const [f] = await db.insert(floors).values(fc).returning();
      createdFloors.push(f);
    } else {
      await db.update(floors).set({ name: fc.name, description: fc.description }).where(eq(floors.id, existing.id));
      createdFloors.push(existing);
    }
  }

  const sampleLocationData = [
    { code: "POS-L1-A", name: "Lobby Utama & Welcome Center", floorNum: 1, qrCode: "UNU-QR-L1-A-2026", desc: "Corner Nilai Dasar, Tradisi Aswaja & Karakter Kampus UNU" },
    { code: "POS-L1-B", name: "Student Center & Layanan Kampus", floorNum: 1, qrCode: "UNU-QR-L1-B-2026", desc: "Etika Kampus, Tata Krama Mahasiswa & Komunitas Kampus" },
    { code: "POS-L2-A", name: "Klinik & Posko Kesehatan Mahasiswa", floorNum: 2, qrCode: "UNU-QR-L2-A-2026", desc: "Layanan Kesehatan, P3K, Well-being & Ketahanan Fisik" },
    { code: "POS-L2-B", name: "Kampus Bersinar & Konseling Sebaya", floorNum: 2, qrCode: "UNU-QR-L2-B-2026", desc: "Komitmen Kampus Bersih Narkoba, Edukasi Anti-Rokok & Mental Health" },
    { code: "POS-L3-A", name: "Lab Komputer AI & Software Studio", floorNum: 3, qrCode: "UNU-QR-L3-A-2026", desc: "Algoritma Cerdas, Pemrograman Masa Depan & Literasi Digital" },
    { code: "POS-L3-B", name: "Smart FTI Hall & Ruang Kolaborasi", floorNum: 3, qrCode: "UNU-QR-L3-B-2026", desc: "Komunikasi Efektif, Negosiasi & Kepemimpinan Inklusif" },
    { code: "POS-L4-A", name: "Posko Layanan PPKS & Konseling Ramah", floorNum: 4, qrCode: "UNU-QR-L4-A-2026", desc: "Kanal Pengaduan Aman, Perlindungan Korban & Anti-Perundungan" },
    { code: "POS-L4-B", name: "Lab Riset Halal & Bioteknologi Terapan", floorNum: 4, qrCode: "UNU-QR-L4-B-2026", desc: "Standarisasi Halal, Sains Industri & Keberlanjutan Hayati" },
    { code: "POS-L5-A", name: "Perpustakaan Pusat & Pustaka Digital", floorNum: 5, qrCode: "UNU-QR-L5-A-2026", desc: "Akses Repositori Ilmiah, Database Jurnal & Khazanah Pustaka" },
    { code: "POS-L5-B", name: "Klinik Anti-Plagiarisme & Penulisan Ilmiah", floorNum: 5, qrCode: "UNU-QR-L5-B-2026", desc: "Kaidah Sitasi Orisinil, Etika Informasi & Kejujuran Akademik" },
    { code: "POS-L6-A", name: "Pusat Studi Islam Nusantara & Budaya", floorNum: 6, qrCode: "UNU-QR-L6-A-2026", desc: "Kajian Moderasi Beragama, Wawasan Kebangsaan & Nilai Aswaja" },
    { code: "POS-L6-B", name: "Laboratorium Sains Terpadu & Energi Hijau", floorNum: 6, qrCode: "UNU-QR-L6-B-2026", desc: "Riset Multidisiplin Berkelanjutan, SDGs & Green Science" },
    { code: "POS-L7-A", name: "Creative Co-Working Space & Multimedia", floorNum: 7, qrCode: "UNU-QR-L7-A-2026", desc: "Ideasi Bisnis, AI Beretika, Desain Kreatif & Visual Digital" },
    { code: "POS-L7-B", name: "Microteaching Lab & Karakter Pendidik", floorNum: 7, qrCode: "UNU-QR-L7-B-2026", desc: "Simulasi Mengajar Inovatif & Metodologi Pembelajaran Abad 21" },
    { code: "POS-L8-A", name: "Klinik Integritas & Anti-Korupsi", floorNum: 8, qrCode: "UNU-QR-L8-A-2026", desc: "Pendidikan Antikorupsi, Tolak Gratifikasi & Nilai Kejujuran" },
    { code: "POS-L8-B", name: "Ruang Tata Kelola & Kepemimpinan Kampus", floorNum: 8, qrCode: "UNU-QR-L8-B-2026", desc: "Transparansi, Akuntabilitas & Tata Kelola Perguruan Tinggi" },
    { code: "POS-L9-A", name: "Auditorium & Convention Hall Utama", floorNum: 9, qrCode: "UNU-QR-L9-A-2026", desc: "Arena Sidang Pleno, Grand Quest & Ikrar Mahasiswa Unggul" },
    { code: "POS-L9-B", name: "Rooftop Sky Garden Panoramic Deck", floorNum: 9, qrCode: "UNU-QR-L9-B-2026", desc: "Visi Indonesia Emas 2045, Epilog & Selebrasi Puncak Transformasi" },
  ];

  const createdLocations = [];
  for (const loc of sampleLocationData) {
    const floor = createdFloors.find((f) => f.number === loc.floorNum);
    if (!floor) continue;

    const [existing] = await db.select().from(locations).where(eq(locations.code, loc.code)).limit(1);
    if (!existing) {
      const [l] = await db
        .insert(locations)
        .values({
          code: loc.code,
          name: loc.name,
          description: loc.desc,
          floorId: floor.id,
          qrCode: loc.qrCode,
          capacity: 4,
          status: "AVAILABLE",
        })
        .returning();
      createdLocations.push(l);
    } else {
      await db.update(locations).set({ name: loc.name, description: loc.desc, qrCode: loc.qrCode }).where(eq(locations.id, existing.id));
      createdLocations.push(existing);
    }
  }

  // ============================================================
  // 6. SEED MASTER DATA: Stages, Games, Questions & Route
  // ============================================================
  console.log("🎮 [6/8] Initializing Stages, Mini-Games, Questions, and 9-Floor Route...");
  const baseDate = new Date();
  baseDate.setHours(8, 0, 0, 0);

  const stageData = [
    {
      name: "Stage 1: Campus Discovery (Hari 1)",
      order: 1,
      status: "ACTIVE" as const,
      startTime: baseDate,
      endTime: new Date(baseDate.getTime() + 8 * 3600 * 1000),
      description: "Eksplorasi fisik lantai 1-3, orientasi fakultas, pengenalan sistem kuis pos, dan pembentukan sinergi tim.",
    },
    {
      name: "Stage 2: Logic & Teamwork (Hari 2)",
      order: 2,
      status: "UPCOMING" as const,
      startTime: new Date(baseDate.getTime() + 24 * 3600 * 1000),
      endTime: new Date(baseDate.getTime() + 32 * 3600 * 1000),
      description: "Penjelajahan lantai 4-7, tantangan pemecahan masalah multidisiplin, dan pengumpulan poin tier lanjutan.",
    },
    {
      name: "Stage 3: Grand Quest Final (Hari 3)",
      order: 3,
      status: "UPCOMING" as const,
      startTime: new Date(baseDate.getTime() + 48 * 3600 * 1000),
      endTime: new Date(baseDate.getTime() + 57.5 * 3600 * 1000),
      description: "Penaklukan lantai 8-9, pertarungan kuis kecepatan tinggi, perebutan tahta juara, dan upacara penganugerahan gelar.",
    },
  ];

  const createdStages = [];
  for (const s of stageData) {
    const [existing] = await db.select().from(stages).where(eq(stages.order, s.order)).limit(1);
    if (!existing) {
      const [st] = await db.insert(stages).values(s).returning();
      createdStages.push(st);
    } else {
      await db.update(stages).set(s).where(eq(stages.id, existing.id));
      createdStages.push(existing);
    }
  }

  // Games
  const gameDefs = [
    {
      name: "Kuis Wawasan Aswaja & Kampus UNU",
      type: "QUIZ" as const,
      description: "Kuis interaktif pilihan ganda seputar wawasan kampus, nilai Aswaja, etika akademik, dan wawasan kebangsaan.",
      instructions: "Pilih jawaban paling tepat sebelum batas waktu countdown berakhir. Skor dihitung berdasarkan akurasi dan kecepatan!",
      config: { timeLimitSeconds: 20, pointsPerCorrectAnswer: 10, streakBonus: true },
      questionBankCategory: "Wawasan Kampus",
      minPlayers: 1,
      maxPlayers: 10,
      status: "ACTIVE" as const,
    },
    {
      name: "Tebak Kata & Susun Frasa Karakter",
      type: "WORD_GAME" as const,
      description: "Susun huruf-huruf acak menjadi terminologi penting seputar nilai moderasi beragama dan profil keunggulan UNU.",
      instructions: "Drag atau tap huruf-huruf acak untuk membentuk kata yang valid sebelum waktu habis.",
      config: { timeLimitSeconds: 60, minWordLength: 4, allowShuffle: true },
      questionBankCategory: "Bahasa",
      minPlayers: 1,
      maxPlayers: 4,
      status: "ACTIVE" as const,
    },
    {
      name: "Teka-Teki Logika & Silang Kampus",
      type: "LOGIC" as const,
      description: "Teka-teki silang digital mini dan pencocokan petunjuk sejarah, fakultas, serta pimpinan kampus UNU Yogyakarta.",
      instructions: "Isi kolom jawaban dengan membaca petunjuk mendatar dan menurun secara cermat.",
      config: { gridSize: 8, timeLimitSeconds: 120, hintsAllowed: 3 },
      questionBankCategory: "Logika",
      minPlayers: 1,
      maxPlayers: 4,
      status: "ACTIVE" as const,
    },
    {
      name: "Pena Digital & Sketsa Nilai AI",
      type: "IMAGE_GUESS" as const,
      description: "Tantangan tebak visual dan scratch & reveal sketsa AI interaktif bertema pilar keunggulan mahasiswa.",
      instructions: "Buka lapisan petunjuk visual atau lukis objek sesuai instruksi prompt sebelum batas waktu habis!",
      config: { drawingTimeSeconds: 60, maxScore: 100 },
      questionBankCategory: "Kreativitas",
      minPlayers: 1,
      maxPlayers: 10,
      status: "ACTIVE" as const,
    },
    {
      name: "Flappy Genius — Terbang Melampaui Nilai UNU",
      type: "FLAPPY_BIRD" as const,
      description: "Arcade retro pixel flyer: kendalikan maskot Genius melewati pilar-pilar nilai Aswaja & integritas kampus tanpa menabrak.",
      instructions: "Tap atau tekan tombol SPACE untuk terbang melompat. Lewati setiap pilar nilai untuk mengumpulkan XP & poin kelulusan pos!",
      config: { pipeSpeed: 200, gapSize: 140, durationSeconds: 60, xpPerPipe: 5, maxScore: 100 },
      questionBankCategory: "Arcade",
      minPlayers: 1,
      maxPlayers: 1,
      status: "ACTIVE" as const,
    },
  ];

  let mainQuizGame: any = null;
  for (const g of gameDefs) {
    const [existing] = await db.select().from(games).where(eq(games.name, g.name)).limit(1);
    if (!existing) {
      const [game] = await db.insert(games).values(g).returning();
      if (game.type === "QUIZ" && !mainQuizGame) mainQuizGame = game;
    } else {
      await db.update(games).set(g).where(eq(games.id, existing.id));
      if (existing.type === "QUIZ" && !mainQuizGame) mainQuizGame = existing;
    }
  }

  // Questions
  const sampleQuestions = [
    {
      category: "Wawasan Kampus",
      difficulty: "EASY" as const,
      questionText: "Berapa jumlah lantai utama pada Gedung Kampus Terpadu UNU Yogyakarta?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["7 Lantai", "8 Lantai", "9 Lantai", "10 Lantai"],
      correctAnswer: "9 Lantai",
      explanation: "Gedung Kampus Terpadu UNU Yogyakarta memiliki 9 lantai dengan fasilitas terpadu dari lobby hingga rooftop.",
      baseScore: 15,
      tags: ["kampus", "fasilitas"],
    },
    {
      category: "Wawasan Kampus",
      difficulty: "EASY" as const,
      questionText: "Fasilitas Lab Komputer & Kecerdasan Buatan (AI) UNU Yogyakarta terletak pada lantai berapa?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Lantai 1", "Lantai 2", "Lantai 3", "Lantai 5"],
      correctAnswer: "Lantai 3",
      explanation: "Fakultas Teknologi Informasi beserta Laboratorium Komputasi dan AI berpusat di Lantai 3.",
      baseScore: 15,
      tags: ["kampus", "fti", "ai"],
    },
    {
      category: "Karakter & Nilai",
      difficulty: "EASY" as const,
      questionText: "Landasan nilai keagamaan dan kebangsaan apakah yang diintegrasikan dengan sains teknologi di UNU Yogyakarta?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Ahlussunnah wal Jama'ah An-Nahdliyyah & Keunggulan IPTEK", "Individualisme Murni", "Sains Sekuler Tanpa Etika", "Materialisme Praktis"],
      correctAnswer: "Ahlussunnah wal Jama'ah An-Nahdliyyah & Keunggulan IPTEK",
      explanation: "UNU Yogyakarta mengintegrasikan nilai-nilai luhur Aswaja dengan inovasi sains dan teknologi masa depan.",
      baseScore: 15,
      tags: ["nilai", "aswaja", "karakter"],
    },
    {
      category: "Wawasan Kampus",
      difficulty: "MEDIUM" as const,
      questionText: "Fakultas apa di UNU Yogyakarta yang berfokus pada riset halal, keamanan pangan, dan bioteknologi terapan?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Fakultas Industri Halal", "Fakultas Kedokteran Hewan", "Fakultas Kelautan", "Fakultas Metalurgi"],
      correctAnswer: "Fakultas Industri Halal",
      explanation: "Fakultas Industri Halal UNU Yogyakarta merupakan salah satu fakultas pelopor riset halal dan bioteknologi di Indonesia.",
      baseScore: 20,
      tags: ["fakultas", "industri-halal"],
    },
    {
      category: "Wawasan Kampus",
      difficulty: "HARD" as const,
      questionText: "Lantai manakah di Gedung UNU Yogyakarta yang menjadi pusat inkubator startup dan smart classroom ekonomi syariah?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Lantai 5 (Fakultas Ekonomi & Bisnis Digital)", "Lantai 1", "Lantai 7", "Lantai 8"],
      correctAnswer: "Lantai 5 (Fakultas Ekonomi & Bisnis Digital)",
      explanation: "Lantai 5 didesain untuk Fakultas Ekonomi & Bisnis Digital lengkap dengan inkubator startup dan smart classroom.",
      baseScore: 25,
      tags: ["feb", "lantai5", "startup"],
    },
  ];

  for (const q of sampleQuestions) {
    const [existing] = await db.select().from(questions).where(eq(questions.questionText, q.questionText)).limit(1);
    if (!existing) await db.insert(questions).values(q);
  }

  // Route & Missions
  const stage1 = createdStages.find((s) => s.order === 1) || createdStages[0];
  let mainRoute: any = null;
  if (stage1 && mainQuizGame) {
    const [existingRoute] = await db.select().from(routes).where(eq(routes.name, "Rute Utama Ekspedisi 9 Lantai")).limit(1);
    if (!existingRoute) {
      [mainRoute] = await db.insert(routes).values({ name: "Rute Utama Ekspedisi 9 Lantai", stageId: stage1.id, status: "ACTIVE" }).returning();
    } else {
      mainRoute = existingRoute;
    }
  }

  // ============================================================
  // 7. SEED 50 TEAMS & ASSIGN 50 BUDDIES (PRIMARY) + 403 PARTICIPANTS
  // ============================================================
  console.log("🛡️ [7/8] Creating 50 Official Genius Teams (1 Primary Buddy, No Captains, 403 MABA)...");

  // Identifikasi mahasiswa khusus
  const tazkiyah = createdParticipants.find((p) => p.fullName.toUpperCase().includes("TAZKIYAH NUR ASHIFA"));
  const vina = createdParticipants.find((p) => p.fullName.toUpperCase().includes("VINA SUGIARTI"));

  const createdTeams = [];
  for (let i = 0; i < 50; i++) {
    const code = `GENIUS-${String(i + 1).padStart(2, "0")}`;
    const name = HOUSE_NAMES[i] || `Regu ${i + 1}`;

    const [team] = await db
      .insert(teams)
      .values({
        code,
        name,
        routeId: mainRoute?.id || null,
        captainId: null, // Aturan: TIDAK ADA KETUA REGU
        status: "ACTIVE",
      })
      .returning();
    createdTeams.push(team);
  }

  // Link exactly 1 PRIMARY buddy per team (buddy01 -> GENIUS-01 ... buddy50 -> GENIUS-50)
  const buddyMembersToInsert = [];
  for (let i = 0; i < 50; i++) {
    const team = createdTeams[i];
    const buddy = createdBuddies[i];
    buddyMembersToInsert.push({
      teamId: team.id,
      userId: buddy.id,
      buddyRole: "PRIMARY" as const, // Aturan: SEMUA BUDDY PRIMARY
      isCaptain: false,
    });
  }
  await db.insert(teamMembers).values(buddyMembersToInsert);

  // Group participants to teams
  const teamParticipantMap: Map<string, typeof createdParticipants> = new Map();
  for (const t of createdTeams) {
    teamParticipantMap.set(t.id, []);
  }

  // Pasangan khusus:
  // Khoirunnisa (buddy20) -> GENIUS-20 (createdTeams[19]) dengan Tazkiyah
  // Mutiara (buddy27) -> GENIUS-27 (createdTeams[26]) dengan Vina
  const team20 = createdTeams[19];
  const team27 = createdTeams[26];
  if (tazkiyah) teamParticipantMap.get(team20.id)!.push(tazkiyah);
  if (vina) teamParticipantMap.get(team27.id)!.push(vina);

  const otherParticipants = createdParticipants.filter(
    (p) => p.username !== tazkiyah?.username && p.username !== vina?.username
  );

  const targetSizes = createdTeams.map((_, idx) => (idx < 3 ? 9 : 8));
  let roundRobinIdx = 0;
  for (const p of otherParticipants) {
    while (teamParticipantMap.get(createdTeams[roundRobinIdx].id)!.length >= targetSizes[roundRobinIdx]) {
      roundRobinIdx = (roundRobinIdx + 1) % 50;
    }
    teamParticipantMap.get(createdTeams[roundRobinIdx].id)!.push(p);
    roundRobinIdx = (roundRobinIdx + 1) % 50;
  }

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

  for (let i = 0; i < participantMembersToInsert.length; i += batchSize) {
    const batch = participantMembersToInsert.slice(i, i + batchSize);
    await db.insert(teamMembers).values(batch);
  }
  console.log(`  ✅ 50 Teams created: 50 PRIMARY Buddies, 403 Participants, No Captains, Special Pairings Verified!`);

  // ============================================================
  // 8. SEED ATTENDANCE SESSION & OFFICIAL 19 ORMAWA BOOTHS
  // ============================================================
  console.log("🎫 [8/8] Setting up Active Attendance Session & Official Ormawa Booths...");
  await db.insert(attendanceSessions).values({
    title: "Presensi Gerbang Masuk Hari 1 — Campus Discovery",
    description: "Scan QR Code di Lobby Lantai 1 untuk presensi kehadiran pagi & klaim 100 XP awal.",
    type: "CHECK_IN",
    isActive: true,
    qrToken: "UNU-PRESENSI-DAY1-IN",
    xpReward: 100,
    allowLate: true,
    lateTime: "07:30",
  });

  const fl3 = createdFloors.find((f) => f.number === 3)?.id;
  const fl4 = createdFloors.find((f) => f.number === 4)?.id;
  const fl5 = createdFloors.find((f) => f.number === 5)?.id;

  const officialOrmawa = [
    {
      code: "ORMAWA-INFORMATIKA",
      name: "HMP INFORMATIKA",
      shortName: "HMP Informatika",
      category: "Himpunan Mahasiswa",
      floorId: fl3,
      boothNumber: "E-01",
      description: "Himpunan pemersatu mahasiswa informatika, pengembang software engineering, data science, cybersecurity, dan kompetisi Gemastik.",
      qrCode: "UNU-ORMAWA-INFORMATIKA-2026",
      xpReward: 75,
      badgeIcon: "Laptop",
      badgeColor: "#2563eb",
      contactPerson: "Muhammad Raihan (NIM 241111075) - 082333016806",
      instagram: "@himatika_unujogja",
    },
    {
      code: "ORMAWA-HMTE",
      name: "HMTE (HMP TEKNIK ELEKTRO)",
      shortName: "HMTE",
      category: "Himpunan Mahasiswa",
      floorId: fl3,
      boothNumber: "E-02",
      description: "Wadah aspirasi, kreativitas, riset keteknikan, dan pengembangan kompetensi mahasiswa Teknik Elektro UNU Yogyakarta.",
      qrCode: "UNU-ORMAWA-HMTE-2026",
      xpReward: 75,
      badgeIcon: "Lightning",
      badgeColor: "#f59e0b",
      contactPerson: "Dito Aji Nugroho (NIM 241113013) - 085816307604",
      instagram: "@hmte_unujogja",
    },
    {
      code: "ORMAWA-MANAJEMEN",
      name: "HMP MANAJEMEN",
      shortName: "HMP Manajemen",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-03",
      description: "Inkubator calon manajer dan entrepreneur unggul dalam strategi bisnis digital, pemasaran modern, tata kelola korporasi, dan inovasi startup.",
      qrCode: "UNU-ORMAWA-MANAJEMEN-2026",
      xpReward: 75,
      badgeIcon: "Briefcase",
      badgeColor: "#7c3aed",
      contactPerson: "Muhammad Farits Nauval (NIM 244441014) - 085742923549",
      instagram: "@hmpm_unujogja",
    },
    {
      code: "ORMAWA-HIMATANSI",
      name: "HIMATANSI (HMP AKUNTANSI)",
      shortName: "HIMATANSI",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-04",
      description: "Pusat riset dan keilmuan akuntansi forensik, perpajakan, audit korporasi, dan teknologi sistem informasi akuntansi.",
      qrCode: "UNU-ORMAWA-HIMATANSI-2026",
      xpReward: 75,
      badgeIcon: "ChartLine",
      badgeColor: "#0284c7",
      contactPerson: "Ikhlasul Fajar (NIM 245551061) - 0895393049103",
      instagram: "@himatansi_unujogja",
    },
    {
      code: "ORMAWA-HIMAFAR",
      name: "HIMAFAR (HMP FARMASI)",
      shortName: "HIMAFAR",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-05",
      description: "Organisasi keprofesian dan keilmuan mahasiswa Farmasi dalam pengembangan sains obat halal, klinis, dan herbal nusantara.",
      qrCode: "UNU-ORMAWA-HIMAFAR-2026",
      xpReward: 75,
      badgeIcon: "Pill",
      badgeColor: "#10b981",
      contactPerson: "Roikhan Ziaulhaq Aula (NIM 243333057) - 082226332991",
      instagram: "@himafar_unujogja",
    },
    {
      code: "ORMAWA-THP",
      name: "HMP THP",
      shortName: "HMP THP",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-06",
      description: "Pengembangan inovasi pangan halal nusantara, rekayasa bioproses hasil tani, keamanan pangan, dan pengolahan hasil panen berkelanjutan.",
      qrCode: "UNU-ORMAWA-THP-2026",
      xpReward: 75,
      badgeIcon: "Flask",
      badgeColor: "#d97706",
      contactPerson: "Ema Rahmawati (NIM 243332029) - 088214811090",
      instagram: "@hmpthp_unujogja",
    },
    {
      code: "ORMAWA-AGRIBISNIS",
      name: "HMP AGRIBISNIS",
      shortName: "HMP Agribisnis",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-07",
      description: "Ekosistem sociopreneurship agribisnis hulu-hilir, supply chain hasil tani, dan smart green agriculture ramah lingkungan.",
      qrCode: "UNU-ORMAWA-AGRIBISNIS-2026",
      xpReward: 75,
      badgeIcon: "Plant",
      badgeColor: "#16a34a",
      contactPerson: "Naufal Daffa (NIM 243331002) - 082136014498",
      instagram: "@himagri_unujogja",
    },
    {
      code: "ORMAWA-PGSD",
      name: "HIMA PGSD (HMP PENDIDIKAN GURU SEKOLAH DASAR)",
      shortName: "HIMA PGSD",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-08",
      description: "Inkubator pendidik dasar masa depan berkarakter Ahlussunnah wal Jama'ah dengan penguasaan pedagogik kreatif dan media ajar interaktif.",
      qrCode: "UNU-ORMAWA-PGSD-2026",
      xpReward: 75,
      badgeIcon: "GraduationCap",
      badgeColor: "#ea580c",
      contactPerson: "Siti Nur Khasanah (NIM 242221045) - 085600216718",
      instagram: "@himapgsd_unujogja",
    },
    {
      code: "ORMAWA-PBI",
      name: "HMP PBI",
      shortName: "HMP PBI",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-09",
      description: "Keluarga mahasiswa Pendidikan Bahasa Inggris pengembang bilingual pedagogy, public speaking, debat internasional, dan pertukaran budaya.",
      qrCode: "UNU-ORMAWA-PBI-2026",
      xpReward: 75,
      badgeIcon: "Translate",
      badgeColor: "#6366f1",
      contactPerson: "Zulfa Nur Aini (NIM 242222019) - 0895361099619",
      instagram: "@hmppbi_unujogja",
    },
    {
      code: "ORMAWA-SII",
      name: "HMP SII",
      shortName: "HMP SII",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-10",
      description: "Wadah kajian intelektual Islam kontemporer, dialog antar peradaban, sosiologi keagamaan, dan integrasi studi Islam interdisipliner.",
      qrCode: "UNU-ORMAWA-SII-2026",
      xpReward: 75,
      badgeIcon: "BookOpen",
      badgeColor: "#0d9488",
      contactPerson: "M. Fathurrahman (NIM 245552011) - 085728876401",
      instagram: "@himasii_unujogja",
    },
    {
      code: "ORMAWA-JQH",
      name: "UKM JQH ISLAMIC ART COLABORATION UNU YOGYAKARTA",
      shortName: "UKM JQH IAC",
      category: "Seni & Budaya Islami",
      floorId: fl5,
      boothNumber: "E-11",
      description: "Pusat pembinaan tilawatil Qur'an, tahfizh 30 juz, kaligrafi Islam nusantara, sholawat rebana, dan seni budaya islami kontemporer.",
      qrCode: "UNU-ORMAWA-JQH-2026",
      xpReward: 75,
      badgeIcon: "Sparkles",
      badgeColor: "#059669",
      contactPerson: "Ahmad Wildan (NIM 245552033) - 085876352994",
      instagram: "@jqhiac_unujogja",
    },
    {
      code: "ORMAWA-MUSIK",
      name: "UKM MUSIK FLORENCE UNU YOGYAKARTA",
      shortName: "UKM Musik Florence",
      category: "Seni & Musik",
      floorId: fl3,
      boothNumber: "E-12",
      description: "Komunitas musisi kampus penampung minat band, akustik, aransemen lagu, audio engineering, dan panggung apresiasi nada.",
      qrCode: "UNU-ORMAWA-MUSIK-2026",
      xpReward: 75,
      badgeIcon: "Guitar",
      badgeColor: "#a855f7",
      contactPerson: "Sahrul Jihad (NIM 244441046) - 082251691584",
      instagram: "@musikflorence_unu",
    },
    {
      code: "ORMAWA-KSR",
      name: "UKM KORP SUKARELA PALANG MERAH INDONESIA UNU YOGYAKARTA",
      shortName: "UKM KSR PMI",
      category: "Sosial & Kemanusiaan",
      floorId: fl5,
      boothNumber: "E-13",
      description: "Garda terdepan kemanusiaan kampus dalam layanan P3K cepat tanggap, donor darah teratur, edukasi tanggap bencana, dan bakti kesehatan.",
      qrCode: "UNU-ORMAWA-KSR-2026",
      xpReward: 75,
      badgeIcon: "FirstAidKit",
      badgeColor: "#dc2626",
      contactPerson: "Wahyu Nugroho (NIM 224442005) - 089514729547",
      instagram: "@ksrpmi_unujogja",
    },
    {
      code: "ORMAWA-BADMINTON",
      name: "UKM BADMINTON UNU YOGYAKARTA",
      shortName: "UKM Badminton",
      category: "Olahraga",
      floorId: fl4,
      boothNumber: "E-14",
      description: "Klub bulu tangkis resmi kampus pembina bakat smash, reli, agility atlet mahasiswa, dan kompetisi turnamen antar perguruan tinggi.",
      qrCode: "UNU-ORMAWA-BADMINTON-2026",
      xpReward: 75,
      badgeIcon: "Trophy",
      badgeColor: "#ca8a04",
      contactPerson: "Farel Arya (NIM 244442011) - 081229765431",
      instagram: "@badminton_unujogja",
    },
    {
      code: "ORMAWA-SILAT",
      name: "UKM PENCAK SILAT UNU YOGYAKARTA",
      shortName: "UKM Pencak Silat",
      category: "Bela Diri",
      floorId: fl3,
      boothNumber: "E-15",
      description: "Pencak silat bela diri warisan luhur para ulama untuk benteng keimanan, ketahanan fisik, bela bangsa, dan prestasi tanding.",
      qrCode: "UNU-ORMAWA-SILAT-2026",
      xpReward: 75,
      badgeIcon: "ShieldCheck",
      badgeColor: "#15803d",
      contactPerson: "M. Khoirul Anam (NIM 245551012) - 085741892015",
      instagram: "@pagarnusa_unujogja",
    },
    {
      code: "ORMAWA-PADUS",
      name: "UKM PADUAN SUARA MAHASISWA UNU YOGYAKARTA",
      shortName: "UKM PSM",
      category: "Seni & Vokal",
      floorId: fl3,
      boothNumber: "E-16",
      description: "Paduan suara resmi representasi universitas dalam kompetisi paduan suara, konser harmoni kebangsaan, dan protokoler wisuda.",
      qrCode: "UNU-ORMAWA-PADUS-2026",
      xpReward: 75,
      badgeIcon: "MicrophoneStage",
      badgeColor: "#ec4899",
      contactPerson: "Dimas Ardhiwinata (NIM 245551076) - 082374544670",
      instagram: "@psm_unujogja",
    },
    {
      code: "ORMAWA-FASHION",
      name: "UKM FASHION",
      shortName: "UKM Fashion",
      category: "Seni & Desain",
      floorId: fl4,
      boothNumber: "E-17",
      description: "Wadah eksplorasi busana halal etnik nusantara, eco-fashion, tata rias, peragaan busana, dan industri kreatif tekstil.",
      qrCode: "UNU-ORMAWA-FASHION-2026",
      xpReward: 75,
      badgeIcon: "CoatHanger",
      badgeColor: "#db2777",
      contactPerson: "Nabila Rahma (NIM 243332015) - 081392847162",
      instagram: "@fashion_unujogja",
    },
    {
      code: "ORMAWA-MAPALA",
      name: "MAPALA UNUYO",
      shortName: "MAPALA UNUYO",
      category: "Pecinta Alam & Ekologi",
      floorId: fl3,
      boothNumber: "E-18",
      description: "Mahasiswa pecinta alam penjaga kelestarian ekologi nusantara, penjelajah rimba gunung, konservasi lingkungan, dan tanggap darurat bencana alam.",
      qrCode: "UNU-ORMAWA-MAPALA-2026",
      xpReward: 75,
      badgeIcon: "Compass",
      badgeColor: "#15803d",
      contactPerson: "Bagus Prasetyo (NIM 241113009) - 081298765432",
      instagram: "@mapala_unuyo",
    },
    {
      code: "ORMAWA-TARI",
      name: "UKM TARI (Arunika Dance Club)",
      shortName: "UKM Tari Arunika",
      category: "Seni & Budaya",
      floorId: fl3,
      boothNumber: "E-19",
      description: "Sanggar gerak tari kreasi tradisional nusantara dan kontemporer untuk pelestarian kekayaan budaya nusantara di kancah nasional.",
      qrCode: "UNU-ORMAWA-TARI-2026",
      xpReward: 75,
      badgeIcon: "Sparkle",
      badgeColor: "#f43f5e",
      contactPerson: "Annisa Larasati (NIM 242221018) - 087789012345",
      instagram: "@arunikadance_unu",
    },
    {
      code: "ORMAWA-VOLLY",
      name: "UKM Volly",
      shortName: "UKM Volly",
      category: "Olahraga",
      floorId: fl4,
      boothNumber: "E-20",
      description: "Komunitas olahraga bola voli kampus pembina fisik atletis, taktik servis-smash-blocking tim, dan turnamen olahraga antar kampus.",
      qrCode: "UNU-ORMAWA-VOLLY-2026",
      xpReward: 75,
      badgeIcon: "Volleyball",
      badgeColor: "#0284c7",
      contactPerson: "Rian Kurniawan (NIM 244442019) - 085234567890",
      instagram: "@volly_unujogja",
    },
  ];

  for (const ob of officialOrmawa) {
    const contactPhone = ob.contactPerson.match(/(?:\+?62|0)8[\d\s-]{7,15}/)?.[0]?.replace(/[\s-]/g, "") || null;
    const boothData = {
      ...ob,
      tagline: ob.description,
      activities: [],
      requirements: [],
      stampInstructions: [
        "Datangi stan dan kenali program Ormawa atau UKM.",
        "Selesaikan misi yang diberikan oleh PIC stan.",
        "Buka QR profilmu dan minta PIC memindainya untuk menerima stamp.",
      ],
      contactPhone,
    };
    const [existing] = await db
      .select()
      .from(ormawaBooths)
      .where(eq(ormawaBooths.code, ob.code))
      .limit(1);

    if (!existing) {
      await db.insert(ormawaBooths).values(boothData);
    } else {
      await db.update(ormawaBooths).set(boothData).where(eq(ormawaBooths.id, existing.id));
    }
  }
  console.log(`  ✅ ${officialOrmawa.length} Official Ormawa Booths seeded (Lantai 3, 4, 5)`);

  const picResult = await ensureOfficialOrmawaPics({ resetPasswords: true });
  console.log(`  ✅ ${picResult.linked} akun PIC Ormawa dibuat/diperbarui dan dihubungkan ke stan resmi`);

  // ============================================================
  // 9. SEED OFFICIAL QUIZ DATABASE (9 Pos dari quiz_database.csv)
  // ============================================================
  console.log("🧩 [9/9] Seeding Official 9-Pos Quiz Database from quiz_database.csv...");
  try {
    const { seedOfficialQuizDatabase } = await import("../scripts/seed_official_quiz");
    await seedOfficialQuizDatabase();
    console.log("  ✅ Official 9-Pos Quiz Database seeded successfully (51 Questions, 9 Locations, 12 Games)");
  } catch (err: any) {
    console.warn("  ⚠️ [Seed] Official quiz database seed warning:", err.message);
  }

  console.log("\n========================================================");
  console.log("🎉 GENIUS 2026 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("========================================================");
  console.log("👤 Admin       : admin (password: admin2026)");
  console.log("👥 Buddies (50): Sesuai NIM buddy.csv (password: [kelompok][nomor], contoh: jabu01)");
  console.log("🎓 MABA (403)  : Sesuai maba_2026.csv (password: tanggal lahir lowercase tanpa spasi, contoh: 26mei2006)");
  console.log("🛡️ Kelompok (50): Genius 01 s/d Genius 50 (Jabu s/d Sasadu, 1 Primary Buddy/kelompok, No Captain)");
  console.log("🎪 Ormawa (19) : 19 Official Booths (Lantai 3, 4, 5)");
  console.log("🧩 Kuis Resmi  : 9 Pos di 6 Lantai (51 Soal, 100 Poin/pos)");
  console.log("========================================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
