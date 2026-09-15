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
import { eq, and } from "drizzle-orm";
import { RAW_BUDDY_DATA } from "./data/officialBuddies";
import { OFFICIAL_PARTICIPANTS } from "./data/participants";

async function seed() {
  console.log("🌱 Starting GENIUS 2026 Database Seeding (Clean Slate)...");

  // ============================================================
  // 1. CLEAN SLATE: Bersihkan Seluruh Data Transaksi & Akun Pengguna
  // ============================================================
  console.log("🧹 [1/8] Cleaning up existing transactional, team, and user data...");
  await db.delete(dailyReflections);
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
  // 3. SEED 10 BUDDY (NIM 25111101 - 25111110)
  // ============================================================
  console.log("👥 [3/8] Creating 10 Official Buddies (NIM 25111101 - 25111110)...");
  const buddyInserts = RAW_BUDDY_DATA.slice(0, 10).map((b, idx) => {
    const nim = `251111${String(idx + 1).padStart(2, "0")}`;
    return {
      username: nim,
      passwordHash: defaultPassword,
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
    };
  });

  const createdBuddies = await db.insert(users).values(buddyInserts).returning();
  console.log(`  ✅ ${createdBuddies.length} Official Buddies registered with NIM 25111101 - 25111110 (Password: genius2026)`);

  // ============================================================
  // 4. SEED 100 PARTICIPANTS (NIM 26111101 - 26111200)
  // ============================================================
  console.log("🎓 [4/8] Creating 100 Official Participants (NIM 26111101 - 26111200)...");
  const participantInserts = OFFICIAL_PARTICIPANTS.map((p) => ({
    username: p.nim,
    passwordHash: defaultPassword,
    fullName: p.fullName,
    role: "PARTICIPANT" as const,
    status: "ACTIVE" as const,
    gender: p.gender,
    faculty: p.faculty,
    prodi: p.prodi,
    characterClass: p.characterClass,
    characterTitle: "Novice Adventurer",
    characterTier: 1,
    unlockedTitles: ["Novice Adventurer"],
    avatarUrl: p.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png",
  }));

  const createdParticipants = await db.insert(users).values(participantInserts).returning();
  console.log(`  ✅ ${createdParticipants.length} Participants registered with NIM 26111101 - 26111200 (Password: genius2026)`);

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
  // 7. SEED 5 TEAMS & ASSIGN 2 BUDDIES + 20 PARTICIPANTS EACH
  // ============================================================
  console.log("🛡️ [7/8] Creating 5 Official Genius Teams & Linking 2 Buddies + 20 MABA per Team...");

  const teamDefinitions = [
    {
      code: "GENIUS-01",
      name: "Jabu",
      captainNim: "26111101",
      primaryBuddyNim: "25111101",
      assistantBuddyNim: "25111102",
      participantNims: OFFICIAL_PARTICIPANTS.slice(0, 20).map((p) => p.nim),
    },
    {
      code: "GENIUS-02",
      name: "Bolon",
      captainNim: "26111121",
      primaryBuddyNim: "25111103",
      assistantBuddyNim: "25111104",
      participantNims: OFFICIAL_PARTICIPANTS.slice(20, 40).map((p) => p.nim),
    },
    {
      code: "GENIUS-03",
      name: "Gadang",
      captainNim: "26111141",
      primaryBuddyNim: "25111105",
      assistantBuddyNim: "25111106",
      participantNims: OFFICIAL_PARTICIPANTS.slice(40, 60).map((p) => p.nim),
    },
    {
      code: "GENIUS-04",
      name: "Limas",
      captainNim: "26111161",
      primaryBuddyNim: "25111107",
      assistantBuddyNim: "25111108",
      participantNims: OFFICIAL_PARTICIPANTS.slice(60, 80).map((p) => p.nim),
    },
    {
      code: "GENIUS-05",
      name: "Lontik",
      captainNim: "26111181",
      primaryBuddyNim: "25111109",
      assistantBuddyNim: "25111110",
      participantNims: OFFICIAL_PARTICIPANTS.slice(80, 100).map((p) => p.nim),
    },
  ];

  const houseNames = [
    "Jabu", "Bolon", "Gadang", "Limas", "Lontik", "Kajang", "Bubung", "Panggung", "Nuwo", "Baduy",
    "Gudang", "Bapang", "Joglo", "Kampung", "Panggang", "Jompongan", "Jolopong", "Julang", "Tagog", "Badak",
    "Capit", "Jubleg", "Tikel", "Baresan", "Crocogan", "Tengger", "Bale", "Lumbung", "Uma", "Omo",
    "Sebua", "Hada", "Betang", "Lamin", "Baloy", "Banjar", "Tambi", "Laika", "Boyang", "Buton",
    "Lego", "Lopo", "Mbaru", "Sao", "Musalaki", "Uma", "Honai", "Lopo", "Baileo", "Sasadu",
  ];
  teamDefinitions.push(...houseNames.slice(5).map((name, index) => ({
    code: `GENIUS-${String(index + 6).padStart(2, "0")}`,
    name,
    participantNims: [],
  })));

  for (const tDef of teamDefinitions) {
    const captainUser = createdParticipants.find((p) => p.username === tDef.captainNim);
    const primaryBuddy = createdBuddies.find((b) => b.username === tDef.primaryBuddyNim);
    const assistantBuddy = createdBuddies.find((b) => b.username === tDef.assistantBuddyNim);

    const [team] = await db
      .insert(teams)
      .values({
        name: tDef.name,
        code: tDef.code,
        routeId: mainRoute?.id || null,
        captainId: captainUser?.id || null,
        status: "ACTIVE",
      })
      .returning();

    // Link Primary Buddy
    if (primaryBuddy) {
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: primaryBuddy.id,
        buddyRole: "PRIMARY",
        isCaptain: false,
      });
    }

    // Link Assistant Buddy
    if (assistantBuddy) {
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: assistantBuddy.id,
        buddyRole: "ASSISTANT",
        isCaptain: false,
      });
    }

    // Link 20 Participants
    const membersToInsert = [];
    for (const pNim of tDef.participantNims) {
      const partUser = createdParticipants.find((p) => p.username === pNim);
      if (partUser) {
        membersToInsert.push({
          teamId: team.id,
          userId: partUser.id,
          isCaptain: pNim === tDef.captainNim,
          buddyRole: null,
        });
      }
    }
    if (membersToInsert.length > 0) {
      await db.insert(teamMembers).values(membersToInsert);
    }
    console.log(`  ✅ ${tDef.name} (${tDef.code}): Primary Buddy ${tDef.primaryBuddyNim}, Assistant ${tDef.assistantBuddyNim}, 20 MABA, Kapten ${tDef.captainNim}`);
  }

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
      code: "ORMAWA-HMTE",
      name: "Himpunan Mahasiswa Teknik Elektro (HMTE)",
      shortName: "HMTE",
      category: "Himpunan Mahasiswa",
      floorId: fl3,
      boothNumber: "E-01",
      description: "Wadah aspirasi, kreativitas, riset keteknikan, dan pengembangan kompetensi mahasiswa Teknik Elektro UNU Yogyakarta.",
      qrCode: "UNU-ORMAWA-HMTE-2026",
      xpReward: 75,
      badgeIcon: "Lightning",
      badgeColor: "#f59e0b",
      contactPerson: "Dito Aji Nugroho (NIM 241113013) - 085816307604",
      instagram: "@hmte_unujogja",
    },
    {
      code: "ORMAWA-HIMAFAR",
      name: "Himpunan Mahasiswa Farmasi (HIMAFAR)",
      shortName: "HIMAFAR",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-02",
      description: "Organisasi keprofesian dan keilmuan mahasiswa Farmasi dalam pengembangan sains obat halal, klinis, dan herbal nusantara.",
      qrCode: "UNU-ORMAWA-HIMAFAR-2026",
      xpReward: 75,
      badgeIcon: "Pill",
      badgeColor: "#10b981",
      contactPerson: "Roikhan Ziaulhaq Aula (NIM 243333057) - 082226332991",
      instagram: "@himafar_unujogja",
    },
    {
      code: "ORMAWA-MUSIK",
      name: "UKM Musik Florence UNU Yogyakarta",
      shortName: "Musik Florence",
      category: "Seni & Musik",
      floorId: fl3,
      boothNumber: "E-03",
      description: "Komunitas musisi kampus penampung minat band, akustik, aransemen lagu, audio engineering, dan panggung apresiasi nada.",
      qrCode: "UNU-ORMAWA-MUSIK-2026",
      xpReward: 75,
      badgeIcon: "Guitar",
      badgeColor: "#a855f7",
      contactPerson: "Sahrul Jihad (NIM 244441046) - 082251691584",
      instagram: "@musikflorence_unu",
    },
    {
      code: "ORMAWA-HIMASII",
      name: "Himpunan Mahasiswa Studi Islam Interdisipliner (HIMASII)",
      shortName: "HIMASII",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-04",
      description: "Wadah kajian intelektual Islam kontemporer, dialog antar peradaban, sosiologi keagamaan, dan integrasi studi Islam interdisipliner.",
      qrCode: "UNU-ORMAWA-HIMASII-2026",
      xpReward: 75,
      badgeIcon: "BookOpen",
      badgeColor: "#0d9488",
      contactPerson: "Risco Dwi Kurniawan (NIM 245551083) - 081373453027",
      instagram: "@himasii_unujogja",
    },
    {
      code: "ORMAWA-PADUS",
      name: "UKM Paduan Suara Mahasiswa (PSM) Gita Nusantara",
      shortName: "PSM Gita Nusantara",
      category: "Seni & Vokal",
      floorId: fl3,
      boothNumber: "E-05",
      description: "Paduan suara resmi representasi universitas dalam kompetisi paduan suara, konser harmoni kebangsaan, dan protokoler wisuda.",
      qrCode: "UNU-ORMAWA-PADUS-2026",
      xpReward: 75,
      badgeIcon: "MusicNotes",
      badgeColor: "#ec4899",
      contactPerson: "Dimas Ardhiwinata (NIM 245551076) - 082374544670",
      instagram: "@psm_unujogja",
    },
    {
      code: "ORMAWA-HIMATIKA",
      name: "Himpunan Mahasiswa Informatika (HIMATIKA)",
      shortName: "HIMATIKA",
      category: "Himpunan Mahasiswa",
      floorId: fl3,
      boothNumber: "E-06",
      description: "Himpunan pemersatu mahasiswa informatika, pengembang software engineering, data science, cybersecurity, dan kompetisi Gemastik.",
      qrCode: "UNU-ORMAWA-HIMATIKA-2026",
      xpReward: 75,
      badgeIcon: "Code",
      badgeColor: "#2563eb",
      contactPerson: "Muhammad Raihan (NIM 241111075) - 082333016806",
      instagram: "@himatika_unujogja",
    },
    {
      code: "ORMAWA-HIMAGRI",
      name: "Himpunan Mahasiswa Agribisnis (HIMAGRI)",
      shortName: "HIMAGRI",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-07",
      description: "Penggerak agrososiopreneur modern, rantai pasok pangan berkelanjutan, dan pemberdayaan petani milenial berbasis inovasi cerdas.",
      qrCode: "UNU-ORMAWA-HIMAGRI-2026",
      xpReward: 75,
      badgeIcon: "Plant",
      badgeColor: "#65a30d",
      contactPerson: "Eka Aditya (NIM 243331011) - 08812451059",
      instagram: "@himagri_unujogja",
    },
    {
      code: "ORMAWA-HMP-THP",
      name: "Himpunan Mahasiswa Teknologi Hasil Pertanian (HMP THP)",
      shortName: "HMP THP",
      category: "Himpunan Mahasiswa",
      floorId: fl4,
      boothNumber: "E-08",
      description: "Organisasi kemahasiswaan riset pengolahan pangan halal, bioteknologi pangan nusantara, mikrobiologi terapan, dan ketahanan pangan.",
      qrCode: "UNU-ORMAWA-HMP-THP-2026",
      xpReward: 75,
      badgeIcon: "Flask",
      badgeColor: "#ca8a04",
      contactPerson: "Muh. Naufal Rosyiq Ammar (NIM 243332036) - 0882003832116",
      instagram: "@hmpthp_unujogja",
    },
    {
      code: "ORMAWA-HIMATANSI",
      name: "Himpunan Mahasiswa Akuntansi (HIMATANSI)",
      shortName: "HIMATANSI",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-09",
      description: "Wadah pengembangan keahlian akuntansi forensik, audit syariah, financial analysis, dan perpajakan di era transformasi digital.",
      qrCode: "UNU-ORMAWA-HIMATANSI-2026",
      xpReward: 75,
      badgeIcon: "Calculator",
      badgeColor: "#0284c7",
      contactPerson: "Gita Selfiana Tasya (NIM 244442056) - 087726430792",
      instagram: "@himatansi_unujogja",
    },
    {
      code: "ORMAWA-JQH-IAC",
      name: "UKM Jam'iyyatul Qurro' wal Huffazh & Intercollegiate Arabic Club (JQH IAC)",
      shortName: "UKM JQH IAC",
      category: "Keagamaan & Bahasa",
      floorId: fl5,
      boothNumber: "E-10",
      description: "Pusat pembinaan tilawatil Qur'an, tahfizh, kajian tartil, serta dialektika debat dan percakapan bahasa Arab mahasiswa.",
      qrCode: "UNU-ORMAWA-JQH-IAC-2026",
      xpReward: 75,
      badgeIcon: "BookBookmark",
      badgeColor: "#047857",
      contactPerson: "Akhyar Sabqi (NIM 235551030) - 081523754964",
      instagram: "@jqhiac_unujogja",
    },
    {
      code: "ORMAWA-BADMINTON",
      name: "UKM Badminton UNU Yogyakarta",
      shortName: "UKM Badminton",
      category: "Olahraga",
      floorId: fl4,
      boothNumber: "E-11",
      description: "Wadah atlet dan peminat olahraga bulutangkis untuk pembinaan teknik, sparring berkala, dan kejuaraan pekan olahraga mahasiswa.",
      qrCode: "UNU-ORMAWA-BADMINTON-2026",
      xpReward: 75,
      badgeIcon: "Trophy",
      badgeColor: "#f97316",
      contactPerson: "Riski Ramadhan (NIM 251113022) - 081351770669",
      instagram: "@badminton_unujogja",
    },
    {
      code: "ORMAWA-MAPALA",
      name: "UKM Mahasiswa Pecinta Alam UNUYO (MAPALA)",
      shortName: "UKM MAPALA UNUYO",
      category: "Pecinta Alam & Lingkungan",
      floorId: fl4,
      boothNumber: "E-12",
      description: "Organisasi penggiat alam bebas, konservasi rimba gunung, susur gua (caving), rock climbing, dan tanggap darurat search & rescue.",
      qrCode: "UNU-ORMAWA-MAPALA-2026",
      xpReward: 75,
      badgeIcon: "Compass",
      badgeColor: "#166534",
      contactPerson: "Aditya Firdaus Alfajar (NIM 231111047) - 082138047276",
      instagram: "@mapala_unuyo",
    },
    {
      code: "ORMAWA-SILAT",
      name: "UKM Pencak Silat Pagar Nusa UNU Yogyakarta",
      shortName: "UKM Pencak Silat",
      category: "Olahraga & Seni Beladiri",
      floorId: fl3,
      boothNumber: "E-13",
      description: "Kawah candradimuka pesilat Nahdlatul Ulama yang memadukan keindahan jurus tradisional, adu tanding fisik, dan nilai ksatria Aswaja.",
      qrCode: "UNU-ORMAWA-SILAT-2026",
      xpReward: 75,
      badgeIcon: "Shield",
      badgeColor: "#15803d",
      contactPerson: "Dhany Dwi Saputra (NIM 241113035) - 081288867914",
      instagram: "@silat_unujogja",
    },
    {
      code: "ORMAWA-TARI",
      name: "UKM Seni Tari Tradisional & Modern UNU Yogyakarta",
      shortName: "UKM Tari",
      category: "Seni & Budaya",
      floorId: fl3,
      boothNumber: "E-14",
      description: "Ruang gerak estetika dan koreografi penari muda dalam melestarikan tarian klasik nusantara serta kreasi tari kontemporer.",
      qrCode: "UNU-ORMAWA-TARI-2026",
      xpReward: 75,
      badgeIcon: "Sparkle",
      badgeColor: "#f43f5e",
      contactPerson: "Faiqotul Mahfaza (NIM 244442082) - 082279370055",
      instagram: "@tari_unujogja",
    },
    {
      code: "ORMAWA-HIMA-PGSD",
      name: "Himpunan Mahasiswa Pendidikan Guru Sekolah Dasar (HIMA PGSD)",
      shortName: "HIMA PGSD",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-15",
      description: "Wadah calon pendidik bangsa berkarakter inklusif, pengembang media pembelajaran interaktif, microteaching, dan pendidikan anak abad 21.",
      qrCode: "UNU-ORMAWA-HIMA-PGSD-2026",
      xpReward: 75,
      badgeIcon: "GraduationCap",
      badgeColor: "#4f46e5",
      contactPerson: "Tri Yuliyanto (NIM 242221040) - 085641353117",
      instagram: "@himapgsd_unujogja",
    },
    {
      code: "ORMAWA-HMP-PBI",
      name: "Himpunan Mahasiswa Program Studi Pendidikan Bahasa Inggris (HMP PBI)",
      shortName: "HMP PBI",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-16",
      description: "Komunitas calon guru dan profesional bahasa Inggris, penyelenggara English speech, drama festival, and global pedagogical insights.",
      qrCode: "UNU-ORMAWA-HMP-PBI-2026",
      xpReward: 75,
      badgeIcon: "Translate",
      badgeColor: "#0891b2",
      contactPerson: "Masbihul Abidi (NIM 242222020) - 083138822922",
      instagram: "@hmppbi_unujogja",
    },
    {
      code: "ORMAWA-KSR",
      name: "UKM Korps Sukarela PMI Unit UNU Yogyakarta (KSR PMI)",
      shortName: "UKM KSR PMI UNUYO",
      category: "Sosial & Kemanusiaan",
      floorId: fl4,
      boothNumber: "E-17",
      description: "Garda terdepan kemanusiaan kampus dalam layanan P3K cepat tanggap, donor darah teratur, edukasi tanggap bencana, dan bakti kesehatan.",
      qrCode: "UNU-ORMAWA-KSR-2026",
      xpReward: 75,
      badgeIcon: "FirstAidKit",
      badgeColor: "#dc2626",
      contactPerson: "Wahyu Nugroho (NIM 224442005) - 089514729547",
      instagram: "@ksrpmi_unujogja",
    },
    {
      code: "ORMAWA-PERMASUM",
      name: "PERMASUM UNUYO (Persatuan Mahasiswa Sumatera UNU Yogyakarta)",
      shortName: "PERMASUM UNUYO",
      category: "Organisasi Daerah & Kebudayaan",
      floorId: fl4,
      boothNumber: "E-18",
      description: "Rumah kekeluargaan dan persatuan mahasiswa rantau asal pulau Sumatera di UNU Yogyakarta untuk pelestarian adat, seni, dan sinergi daerah.",
      qrCode: "UNU-ORMAWA-PERMASUM-2026",
      xpReward: 75,
      badgeIcon: "UsersThree",
      badgeColor: "#b45309",
      contactPerson: "Rifki Ramadani (NIM 235551056) - 083830130949",
      instagram: "@permasum_unuyo",
    },
    {
      code: "ORMAWA-HMPM",
      name: "Himpunan Mahasiswa Program Studi Manajemen UNU Yogyakarta (HMPM)",
      shortName: "HMPM UNUYO",
      category: "Himpunan Mahasiswa",
      floorId: fl5,
      boothNumber: "E-19",
      description: "Inkubator calon manajer dan entrepreneur unggul dalam strategi bisnis digital, pemasaran modern, tata kelola korporasi, dan inovasi startup.",
      qrCode: "UNU-ORMAWA-HMPM-2026",
      xpReward: 75,
      badgeIcon: "Briefcase",
      badgeColor: "#7c3aed",
      contactPerson: "Muhammad Farits Nauval (NIM 244441014) - 085742923549",
      instagram: "@hmpm_unujogja",
    },
  ];

  for (const ob of officialOrmawa) {
    const [existing] = await db
      .select()
      .from(ormawaBooths)
      .where(eq(ormawaBooths.code, ob.code))
      .limit(1);

    if (!existing) {
      await db.insert(ormawaBooths).values(ob);
    } else {
      await db.update(ormawaBooths).set(ob).where(eq(ormawaBooths.id, existing.id));
    }
  }
  console.log(`  ✅ ${officialOrmawa.length} Official Ormawa Booths seeded (Lantai 3, 4, 5)`);

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
  console.log("👥 Buddies (10): 25111101 s/d 25111110 (password: genius2026)");
  console.log("🎓 MABA (100)  : 26111101 s/d 26111200 (password: genius2026)");
  console.log("🛡️ Kelompok (5): Jabu s/d Lontik (20 MABA + 2 Buddy/tim)");
  console.log("🎪 Ormawa (19) : 19 Official Booths (Lantai 3, 4, 5)");
  console.log("🧩 Kuis Resmi  : 9 Pos di 6 Lantai (51 Soal, 100 Poin/pos)");
  console.log("========================================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
