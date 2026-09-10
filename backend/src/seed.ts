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
} from "./db/schema";
import { hashPassword } from "./lib/password";
import { eq, and, ne } from "drizzle-orm";
import { RAW_BUDDY_DATA } from "./data/officialBuddies";

async function seed() {
  console.log("🌱 Starting GENIUS 2026 Database Seeding...");

  // 1. Seed Admin & Sample Users
  console.log("Creating Admin & Demo Users...");
  const adminPassword = await hashPassword("admin2026");
  const buddyPassword = await hashPassword("buddy2026");
  const defaultPassword = await hashPassword("genius2026");

  // Check if admin exists
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);

  let adminUser = existingAdmin;
  if (!existingAdmin) {
    [adminUser] = await db
      .insert(users)
      .values({
        username: "admin",
        passwordHash: adminPassword,
        fullName: "Administrator GENIUS",
        role: "ADMIN",
        status: "ACTIVE",
      })
      .returning();
    console.log("  ✅ Admin created: username 'admin', password 'admin2026'");
  }

  // Create sample Buddies
  const [existingBuddy] = await db
    .select()
    .from(users)
    .where(eq(users.username, "buddy_budi"))
    .limit(1);

  let buddyUser = existingBuddy;
  if (!existingBuddy) {
    [buddyUser] = await db
      .insert(users)
      .values({
        username: "buddy_budi",
        passwordHash: buddyPassword,
        fullName: "Budi Santoso (Buddy)",
        role: "BUDDY",
        status: "ACTIVE",
      })
      .returning();
    console.log("  ✅ Sample Buddy created: username 'buddy_budi'");
  }

  const [existingBuddy01] = await db
    .select()
    .from(users)
    .where(eq(users.username, "buddy01"))
    .limit(1);

  if (!existingBuddy01) {
    await db
      .insert(users)
      .values({
        username: "buddy01",
        passwordHash: buddyPassword,
        fullName: "Budi Santoso (Buddy)",
        role: "BUDDY",
        status: "ACTIVE",
      });
    console.log("  ✅ Sample Buddy created: username 'buddy01'");
  }

  // Create sample Participants with rich RPG profiles & evolution tiers
  const sampleParticipantsConfig = [
    {
      username: "peserta_1",
      fullName: "Ahmad Dahlan",
      gender: "MALE",
      characterClass: "CYBER_KNIGHT",
      characterTitle: "Novice Adventurer",
      characterTier: 1,
      unlockedTitles: ["Novice Adventurer", "Penjelajah Kampus Baru"],
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberKnightM1&backgroundColor=0284c7",
    },
    {
      username: "peserta_2",
      fullName: "Fatimah Azzahra",
      gender: "FEMALE",
      characterClass: "TECH_MAGE",
      characterTitle: "Master Kuis Cepat",
      characterTier: 2,
      unlockedTitles: ["Novice Adventurer", "Code Apprentice", "Master Kuis Cepat", "Archmage of Code"],
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=TechMageF2&backgroundColor=6b21a8",
    },
    {
      username: "peserta_3",
      fullName: "Rian Pratama",
      gender: "MALE",
      characterClass: "CODE_ARCHER",
      characterTitle: "Ahli Refleks Kilat",
      characterTier: 2,
      unlockedTitles: ["Novice Adventurer", "Algorithm Scout", "Ahli Refleks Kilat"],
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=CodeArcherM2&backgroundColor=166534",
    },
    {
      username: "peserta_4",
      fullName: "Siti Nurhaliza",
      gender: "FEMALE",
      characterClass: "DATA_ALCHEMIST",
      characterTitle: "Pakar Teka-Teki Kuno",
      characterTier: 2,
      unlockedTitles: ["Novice Adventurer", "Data Seeker", "Pakar Teka-Teki Kuno", "Data Wizard"],
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=DataAlchemistF2&backgroundColor=854d0e",
    },
    {
      username: "peserta_5",
      fullName: "Kevin Wijaya",
      gender: "MALE",
      characterClass: "SHADOW_ASSASSIN",
      characterTitle: "Penakluk 9 Lantai",
      characterTier: 3,
      unlockedTitles: ["Novice Adventurer", "Silent Runner", "Speed Solver", "Penakluk 9 Lantai", "Lantai 9 Conqueror"],
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ShadowAssassinM3&backgroundColor=713f12",
    },
  ];

  const sampleParticipants = [];
  for (const pConfig of sampleParticipantsConfig) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, pConfig.username))
      .limit(1);

    if (!existing) {
      const [p] = await db
        .insert(users)
        .values({
          username: pConfig.username,
          passwordHash: defaultPassword,
          fullName: pConfig.fullName,
          role: "PARTICIPANT",
          status: "ACTIVE",
          gender: pConfig.gender,
          characterClass: pConfig.characterClass,
          characterTitle: pConfig.characterTitle,
          characterTier: pConfig.characterTier,
          unlockedTitles: pConfig.unlockedTitles,
          avatarUrl: pConfig.avatarUrl,
        })
        .returning();
      sampleParticipants.push(p);
    } else {
      // Update with RPG metadata
      await db
        .update(users)
        .set({
          fullName: pConfig.fullName,
          gender: pConfig.gender,
          characterClass: pConfig.characterClass,
          characterTitle: pConfig.characterTitle,
          characterTier: pConfig.characterTier,
          unlockedTitles: pConfig.unlockedTitles,
          avatarUrl: pConfig.avatarUrl,
        })
        .where(eq(users.id, existing.id));
      sampleParticipants.push(existing);
    }
  }
  console.log(`  ✅ ${sampleParticipants.length} Sample RPG Participants verified/updated`);

  // 2. Seed 9 Floors of UNU Yogyakarta
  console.log("Creating 9 Campus Floors...");
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
    const [existing] = await db
      .select()
      .from(floors)
      .where(eq(floors.number, fc.number))
      .limit(1);

    if (!existing) {
      const [f] = await db
        .insert(floors)
        .values({
          number: fc.number,
          name: fc.name,
          description: fc.description,
        })
        .returning();
      createdFloors.push(f);
    } else {
      await db.update(floors).set({ name: fc.name, description: fc.description }).where(eq(floors.id, existing.id));
      createdFloors.push(existing);
    }
  }
  console.log("  ✅ 9 Floors seeded with detailed facility names");

  // 3. Seed 18 Campus Pos Locations (Zona A & B per Lantai)
  console.log("Creating 18 Physical Pos Locations & QR Identifiers...");
  const sampleLocationData = [
    // Lantai 1
    { code: "POS-L1-A", name: "Lobby Utama & Welcome Center", floorNum: 1, qrCode: "UNU-QR-L1-A-2026", desc: "Corner Nilai Dasar, Tradisi Aswaja & Karakter Kampus UNU" },
    { code: "POS-L1-B", name: "Student Center & Layanan Kampus", floorNum: 1, qrCode: "UNU-QR-L1-B-2026", desc: "Etika Kampus, Tata Krama Mahasiswa & Komunitas Kampus" },
    // Lantai 2
    { code: "POS-L2-A", name: "Klinik & Posko Kesehatan Mahasiswa", floorNum: 2, qrCode: "UNU-QR-L2-A-2026", desc: "Layanan Kesehatan, P3K, Well-being & Ketahanan Fisik" },
    { code: "POS-L2-B", name: "Kampus Bersinar & Konseling Sebaya", floorNum: 2, qrCode: "UNU-QR-L2-B-2026", desc: "Komitmen Kampus Bersih Narkoba, Edukasi Anti-Rokok & Mental Health" },
    // Lantai 3
    { code: "POS-L3-A", name: "Lab Komputer AI & Software Studio", floorNum: 3, qrCode: "UNU-QR-L3-A-2026", desc: "Algoritma Cerdas, Pemrograman Masa Depan & Literasi Digital" },
    { code: "POS-L3-B", name: "Smart FTI Hall & Ruang Kolaborasi", floorNum: 3, qrCode: "UNU-QR-L3-B-2026", desc: "Komunikasi Efektif, Negosiasi & Kepemimpinan Inklusif" },
    // Lantai 4
    { code: "POS-L4-A", name: "Posko Layanan PPKS & Konseling Ramah", floorNum: 4, qrCode: "UNU-QR-L4-A-2026", desc: "Kanal Pengaduan Aman, Perlindungan Korban & Anti-Perundungan" },
    { code: "POS-L4-B", name: "Lab Riset Halal & Bioteknologi Terapan", floorNum: 4, qrCode: "UNU-QR-L4-B-2026", desc: "Standarisasi Halal, Sains Industri & Keberlanjutan Hayati" },
    // Lantai 5
    { code: "POS-L5-A", name: "Perpustakaan Pusat & Pustaka Digital", floorNum: 5, qrCode: "UNU-QR-L5-A-2026", desc: "Akses Repositori Ilmiah, Database Jurnal & Khazanah Pustaka" },
    { code: "POS-L5-B", name: "Klinik Anti-Plagiarisme & Penulisan Ilmiah", floorNum: 5, qrCode: "UNU-QR-L5-B-2026", desc: "Kaidah Sitasi Orisinil, Etika Informasi & Kejujuran Akademik" },
    // Lantai 6
    { code: "POS-L6-A", name: "Pusat Studi Islam Nusantara & Budaya", floorNum: 6, qrCode: "UNU-QR-L6-A-2026", desc: "Kajian Moderasi Beragama, Wawasan Kebangsaan & Nilai Aswaja" },
    { code: "POS-L6-B", name: "Laboratorium Sains Terpadu & Energi Hijau", floorNum: 6, qrCode: "UNU-QR-L6-B-2026", desc: "Riset Multidisiplin Berkelanjutan, SDGs & Green Science" },
    // Lantai 7
    { code: "POS-L7-A", name: "Creative Co-Working Space & Multimedia", floorNum: 7, qrCode: "UNU-QR-L7-A-2026", desc: "Ideasi Bisnis, AI Beretika, Desain Kreatif & Visual Digital" },
    { code: "POS-L7-B", name: "Microteaching Lab & Karakter Pendidik", floorNum: 7, qrCode: "UNU-QR-L7-B-2026", desc: "Simulasi Mengajar Inovatif & Metodologi Pembelajaran Abad 21" },
    // Lantai 8
    { code: "POS-L8-A", name: "Klinik Integritas & Anti-Korupsi", floorNum: 8, qrCode: "UNU-QR-L8-A-2026", desc: "Pendidikan Antikorupsi, Tolak Gratifikasi & Nilai Kejujuran" },
    { code: "POS-L8-B", name: "Ruang Tata Kelola & Kepemimpinan Kampus", floorNum: 8, qrCode: "UNU-QR-L8-B-2026", desc: "Transparansi, Akuntabilitas & Tata Kelola Perguruan Tinggi" },
    // Lantai 9
    { code: "POS-L9-A", name: "Auditorium & Convention Hall Utama", floorNum: 9, qrCode: "UNU-QR-L9-A-2026", desc: "Arena Sidang Pleno, Grand Quest & Ikrar Mahasiswa Unggul" },
    { code: "POS-L9-B", name: "Rooftop Sky Garden Panoramic Deck", floorNum: 9, qrCode: "UNU-QR-L9-B-2026", desc: "Visi Indonesia Emas 2045, Epilog & Selebrasi Puncak Transformasi" },
  ];

  const createdLocations = [];
  for (const loc of sampleLocationData) {
    const floor = createdFloors.find((f) => f.number === loc.floorNum);
    if (!floor) continue;

    const [existing] = await db
      .select()
      .from(locations)
      .where(eq(locations.code, loc.code))
      .limit(1);

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
      await db
        .update(locations)
        .set({
          name: loc.name,
          description: loc.desc,
          qrCode: loc.qrCode,
          capacity: 4,
        })
        .where(eq(locations.id, existing.id));
      createdLocations.push(existing);
    }
  }
  console.log(`  ✅ ${createdLocations.length} Physical Pos Locations mapped with verified QR codes`);

  // 4. Seed Stages with Explicit Daily Schedules (Stage 1, 2, 3)
  console.log("Creating Event Stages with Daily Schedule Timestamps...");
  const baseDate = new Date();
  baseDate.setHours(8, 0, 0, 0);

  const day1Start = new Date(baseDate);
  const day1End = new Date(baseDate);
  day1End.setHours(16, 0, 0, 0);

  const day2Start = new Date(baseDate);
  day2Start.setDate(day2Start.getDate() + 1);
  const day2End = new Date(day2Start);
  day2End.setHours(16, 0, 0, 0);

  const day3Start = new Date(baseDate);
  day3Start.setDate(day3Start.getDate() + 2);
  const day3End = new Date(day3Start);
  day3End.setHours(17, 30, 0, 0);

  const stageData = [
    {
      name: "Stage 1: Campus Discovery (Hari 1)",
      order: 1,
      status: "ACTIVE" as const,
      startTime: day1Start,
      endTime: day1End,
      description: "Eksplorasi fisik lantai 1-3, orientasi fakultas, pengenalan sistem kuis pos, dan pembentukan sinergi tim.",
    },
    {
      name: "Stage 2: Logic & Teamwork (Hari 2)",
      order: 2,
      status: "UPCOMING" as const,
      startTime: day2Start,
      endTime: day2End,
      description: "Penjelajahan lantai 4-7, tantangan pemecahan masalah multidisiplin, dan pengumpulan poin tier lanjutan.",
    },
    {
      name: "Stage 3: Grand Quest Final (Hari 3)",
      order: 3,
      status: "UPCOMING" as const,
      startTime: day3Start,
      endTime: day3End,
      description: "Penaklukan lantai 8-9, pertarungan kuis kecepatan tinggi, perebutan tahta juara, dan upacara penganugerahan gelar.",
    },
  ];

  const createdStages = [];
  for (const s of stageData) {
    const [existing] = await db
      .select()
      .from(stages)
      .where(eq(stages.order, s.order))
      .limit(1);

    if (!existing) {
      const [st] = await db
        .insert(stages)
        .values({
          name: s.name,
          order: s.order,
          status: s.status,
          startTime: s.startTime,
          endTime: s.endTime,
          description: s.description,
        })
        .returning();
      createdStages.push(st);
    } else {
      await db.update(stages).set(s).where(eq(stages.id, existing.id));
      createdStages.push(existing);
    }
  }
  console.log("  ✅ Stages seeded with exact schedule");

  // 5. Seed Mini Games Definitions (Focusing on Team Quiz Challenge)
  // 5. Seed Mini Games Definitions (All 9 Frontend User Modules + Campus Engines)
  console.log("Creating Mini Game Definitions (All 9 User Modules + Engines)...");
  const gameDefs = [
    {
      name: "Team Quiz Challenge — Wawasan Kampus & Aswaja",
      type: "QUIZ" as const,
      description: "Kuis interaktif wawasan sejarah UNU Yogyakarta, Aswaja An-Nahdliyah, Sains Modern, dan Etika Mahasiswa.",
      instructions: "Jawab setiap soal pilihan ganda bersama tim secara cepat dan akurat untuk memaksimalkan speed bonus & streak multiplier!",
      config: {
        questionsCount: 5,
        timeLimitSeconds: 90,
        timeLimitPerQuestion: 15,
        streakMultiplier: 1.5,
        baseScorePerQuestion: 15,
        maxSpeedBonusPerQuestion: 10,
        maxScore: 100,
      },
      questionBankCategory: "Kampus UNU",
      minPlayers: 1,
      maxPlayers: 10,
      status: "ACTIVE" as const,
    },
    {
      name: "Benar atau Salah — Satgas PPKS & Nilai Integritas",
      type: "RAPID_ANSWER" as const,
      description: "Tantangan kilat evaluasi pernyataan etika kampus, pencegahan kekerasan seksual (PPKS), dan integritas akademik.",
      instructions: "Tentukan apakah pernyataan yang muncul Benar atau Salah sebelum waktu habis. Hati-hati dengan jebakan pernyataan keliru!",
      config: {
        timeLimitSeconds: 60,
        statementCount: 6,
        maxScore: 100,
        passPercentage: 70,
        baseScorePerStatement: 15,
        speedBonus: 10,
      },
      questionBankCategory: "PPKS & Integritas",
      minPlayers: 1,
      maxPlayers: 5,
      status: "ACTIVE" as const,
    },
    {
      name: "Memory Match Matrix — Lambang & Fasilitas UNU",
      type: "MEMORY" as const,
      description: "Permainan mengingat dan mencocokkan pasangan kartu simbol sains, fakultas UNU, dan fasilitas gedung 9 lantai.",
      instructions: "Balik 2 kartu secara berurutan. Cocokkan seluruh pasangan kartu sebelum batas giliran dan waktu berakhir!",
      config: {
        gridSize: "4x4",
        totalPairs: 8,
        timeLimitSeconds: 120,
        scorePerMatch: 15,
        maxScore: 100,
        maxFlipsAllowed: 28,
        pairs: [
          { id: "unu", labelA: "UNU", labelB: "Universitas Nahdlatul Ulama", tag: "KAMPUS" },
          { id: "fti", labelA: "FTI", labelB: "Fakultas Teknologi Informasi", tag: "FAKULTAS" },
          { id: "ai", labelA: "AI Lab", labelB: "Laboratorium Kecerdasan Buatan Lt.3", tag: "TEKNOLOGI" },
          { id: "sky-garden", labelA: "Sky Garden", labelB: "Rooftop Lantai 9", tag: "LOKASI" },
          { id: "feb", labelA: "FEB", labelB: "Fakultas Ekonomi & Bisnis", tag: "FAKULTAS" },
          { id: "perpustakaan", labelA: "Perpus", labelB: "Jurnal Digital Lantai 5", tag: "FASILITAS" },
          { id: "aswaja", labelA: "Aswaja", labelB: "Ahlussunnah wal Jama'ah", tag: "NILAI" },
          { id: "ppks", labelA: "PPKS", labelB: "Satgas Ruang Aman", tag: "INTEGRITAS" },
        ],
      },
      questionBankCategory: "Memori",
      minPlayers: 1,
      maxPlayers: 5,
      status: "ACTIVE" as const,
    },
    {
      name: "Teka-Teki Silang (TTS) — Khazanah Kampus Hijau",
      type: "PUZZLE" as const,
      description: "Teka-teki silang mendatar & menurun menguji pemahaman sejarah kampus, tokoh NU, dan wawasan kebangsaan.",
      instructions: "Pilih kotak kata, baca petunjuk clue mendatar/menurun, lalu ketik huruf jawaban hingga seluruh kotak terisi sempurna!",
      config: {
        gridRows: 6,
        gridCols: 8,
        timeLimitSeconds: 180,
        maxScore: 100,
        totalClues: 4,
      },
      questionBankCategory: "Teka-Teki",
      minPlayers: 1,
      maxPlayers: 5,
      status: "ACTIVE" as const,
    },
    {
      name: "Tebak Kata Sandi — Anagram & Istilah Akademik",
      type: "WORD_GAME" as const,
      description: "Tantangan menyusun kembali huruf-huruf yang teracak menjadi kata kunci ilmiah, nilai integritas, dan filosofi UNU.",
      instructions: "Seret dan letakkan huruf yang tersedia pada slot jawaban sesuai petunjuk definisi. Manfaatkan tombol hint jika mengalami kebuntuan!",
      config: {
        totalWords: 5,
        timeLimitSeconds: 90,
        maxScore: 100,
        hintPenalty: 5,
        shuffleAllowed: true,
      },
      questionBankCategory: "Logika Kata",
      minPlayers: 1,
      maxPlayers: 5,
      status: "ACTIVE" as const,
    },
    {
      name: "Tebak Posisi & Denah — Navigasi Spasial Gedung",
      type: "LOGIC" as const,
      description: "Uji orientasi spasial dan pengetahuan lokasi gedung kampus UNU. Tebak titik koordinat ruangan atau fasilitas yang diminta.",
      instructions: "Perhatikan nama ruangan/fasilitas yang dicari, lalu klik pin pada denah interaktif seakurat mungkin. Semakin dekat dengan titik asli, semakin besar poinmu!",
      config: {
        toleranceRadiusPx: 40,
        totalRounds: 4,
        timeLimitSeconds: 90,
        maxScore: 100,
        bonusAccuracy: 20,
      },
      questionBankCategory: "Spasial Kampus",
      minPlayers: 1,
      maxPlayers: 5,
      status: "ACTIVE" as const,
    },
    {
      name: "Tebak Gambar & AI Canvas — Kurator Seni Senior",
      type: "IMAGE_GUESS" as const,
      description: "Visual mystery guessing & canvas drawing challenge dinilai langsung oleh AI Art Curator atau ditebak dari petunjuk gambar bertahap.",
      instructions: "Buka lapisan petunjuk visual atau lukis objek sesuai instruksi prompt sebelum batas waktu habis!",
      config: {
        drawingTimeSeconds: 60,
        aiModel: "gemini-2.0-flash",
        maxScore: 100,
        allowColorPalette: true,
        persona: "SARCASTIC_EDUCATIONAL",
        scratchRevealDuration: 45,
      },
      questionBankCategory: "Kreativitas",
      minPlayers: 1,
      maxPlayers: 10,
      status: "ACTIVE" as const,
    },
    {
      name: "Kuis Balapan Regu — Fast Grand Prix UNU",
      type: "TEAM_CHALLENGE" as const,
      description: "Balapan kuis kooperatif antar regu. Jawaban benar dan cepat memacu laju kendaraan/maskot tim menuju garis akhir!",
      instructions: "Pilih jawaban benar secepat kilat bersama rekan regumu. Rangkaian combo jawaban benar memberikan turbo speed boost!",
      config: {
        lapsToWin: 5,
        streakSpeedBoost: 1.5,
        timeLimitSeconds: 120,
        maxScore: 150,
        minPlayers: 2,
        maxPlayers: 10,
      },
      questionBankCategory: "Balapan Regu",
      minPlayers: 2,
      maxPlayers: 10,
      status: "ACTIVE" as const,
    },
    {
      name: "Flappy Genius — Terbang Melampaui Nilai UNU",
      type: "FLAPPY_BIRD" as const,
      description: "Arcade retro pixel flyer: kendalikan maskot Genius melewati pilar-pilar nilai Aswaja & integritas kampus tanpa menabrak.",
      instructions: "Tap atau tekan tombol SPACE untuk terbang melompat. Lewati setiap pilar nilai untuk mengumpulkan XP & poin kelulusan pos!",
      config: {
        pipeSpeed: 200,
        gapSize: 140,
        pipeInterval: 1800,
        gravity: 800,
        jumpForce: -360,
        durationSeconds: 60,
        xpPerPipe: 5,
        maxScore: 100,
        pipeLabels: ["Tasamuh", "Tawasuth", "I'tidal", "Tawazun", "Amar Ma'ruf", "Nahi Munkar"],
      },
      questionBankCategory: "Arcade",
      minPlayers: 1,
      maxPlayers: 1,
      status: "ACTIVE" as const,
    },
    {
      name: "Speed Reaction Blitz — Cyber Reflex Tap",
      type: "REACTION" as const,
      description: "Arena uji kecepatan refleks sensorik. Tap target cyber neon yang muncul secepat kilat untuk mengumpulkan poin tim.",
      instructions: "Ketuk target hijau/emas segera saat muncul. Hindari jebakan target merah yang memotong poin!",
      config: {
        targetCount: 15,
        spawnIntervalMs: 1200,
        timeLimitSeconds: 45,
        maxScore: 100,
        missPenaltyScore: 5,
      },
      questionBankCategory: "Refleks",
      minPlayers: 1,
      maxPlayers: 5,
      status: "ACTIVE" as const,
    },
    {
      name: "Day 1 Incubation — Profiling Karakter & Visi 4 Tahun",
      type: "EXPLORATION" as const,
      description: "16 Skenario interaktif kepemimpinan, riset, dan dinamika tim untuk memetakan Archetype petualang serta ulasan mentor AI.",
      instructions: "Pilih respon keputusan yang paling mencerminkan dirimu. Dapatkan peta radar 5 Traits dan gelar inisiat!",
      config: {
        totalScenarios: 16,
        completionRewardPoints: 100,
        isGameMasterLocked: false,
        aiModel: "gemini-2.0-flash",
      },
      questionBankCategory: "Psikologi",
      minPlayers: 1,
      maxPlayers: 50,
      status: "ACTIVE" as const,
    },
    {
      name: "Boss Showdown — Raid Pertarungan Lantai 9",
      type: "TEAM_CHALLENGE" as const,
      description: "Pertarungan kooperatif pamungkas di Sky Garden Lantai 9 menghadapi Guardian AI untuk penentuan juara angkatan.",
      instructions: "Kombinasikan skill kelas RPG regu kalian, selesaikan Quick-Time Event bersama, dan kalahkan Boss sebelum waktu habis!",
      config: {
        bossMaxHp: 5000,
        timeLimitSeconds: 180,
        qteIntervalSeconds: 8,
        teamDamageMultiplier: 1.25,
        maxScore: 250,
      },
      questionBankCategory: "Boss Raid",
      minPlayers: 3,
      maxPlayers: 20,
      status: "ACTIVE" as const,
    },
  ];

  const createdGames = [];
  let mainQuizGame: any = null;
  for (const g of gameDefs) {
    const [existing] = await db
      .select()
      .from(games)
      .where(eq(games.name, g.name))
      .limit(1);

    if (!existing) {
      const [game] = await db.insert(games).values(g).returning();
      createdGames.push(game);
      if (game.type === "QUIZ" && !mainQuizGame) mainQuizGame = game;
    } else {
      await db.update(games).set(g).where(eq(games.id, existing.id));
      createdGames.push(existing);
      if (existing.type === "QUIZ" && !mainQuizGame) mainQuizGame = existing;
    }
  }
  console.log("  ✅ Mini Game definitions initialized");

  // 6. Seed Rich Question Bank (15+ Curated Questions for UNU Yogyakarta)
  console.log("Creating Expanded Question Bank (UNU Yogyakarta & GENIUS 2026)...");
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
      category: "Teknologi",
      difficulty: "MEDIUM" as const,
      questionText: "Protokol apa yang digunakan oleh platform GENIUS 2026 untuk sinkronisasi multiplayer realtime dalam jaringan kampus?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["WebSocket Native", "SMS Gateway", "Bluetooth Beacon", "Polling HTTP 1.0"],
      correctAnswer: "WebSocket Native",
      explanation: "WebSocket native Bun/Elysia memungkinkan sinkronisasi sesi multiplayer, countdown timer, dan skor secara realtime tanpa jeda.",
      baseScore: 20,
      tags: ["teknologi", "realtime", "websocket"],
    },
    {
      category: "Wawasan Kampus",
      difficulty: "MEDIUM" as const,
      questionText: "Apa nama lokasi yang berada di Lantai 9 Gedung UNU Yogyakarta yang digunakan untuk acara akbar dan arena puncak?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Convention Hall & Rooftop Sky Garden", "Basement Parking", "Perpustakaan Kuno", "Asrama Mahasiswa"],
      correctAnswer: "Convention Hall & Rooftop Sky Garden",
      explanation: "Lantai 9 adalah Convention Hall luas berstandar internasional dan Rooftop Sky Garden dengan pemandangan terbuka.",
      baseScore: 20,
      tags: ["lantai9", "venue"],
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
      category: "Sistem RPG",
      difficulty: "EASY" as const,
      questionText: "Berapa tier evolusi karakter RPG yang dapat diraih peserta sepanjang petualangan GENIUS 2026?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["3 Tier (Novice, Advanced, Ascended)", "1 Tier Saja", "5 Tier", "10 Tier"],
      correctAnswer: "3 Tier (Novice, Advanced, Ascended)",
      explanation: "Karakter peserta berevolusi dari Tier 1 (Novice), Tier 2 (Advanced 200+ pts), hingga Tier 3 (Ascended 500+ pts).",
      baseScore: 15,
      tags: ["rpg", "tier", "evolusi"],
    },
    {
      category: "Karakter & Nilai",
      difficulty: "MEDIUM" as const,
      questionText: "Apa peran utama seorang Buddy dalam petualangan tim GENIUS 2026?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Pemandu, fasilitator misi, dan motivator tim", "Wasit yang hanya mencatat pelanggaran", "Pemain pengganti peserta", "Juri tunggal penentu nilai"],
      correctAnswer: "Pemandu, fasilitator misi, dan motivator tim",
      explanation: "Buddy mendampingi tim, mengontrol sesi permainan di pos, memotivasi peserta, dan memberikan apresiasi bonus.",
      baseScore: 20,
      tags: ["buddy", "tim", "orientasi"],
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
    {
      category: "Wawasan Kampus",
      difficulty: "HARD" as const,
      questionText: "Di lantai berapakah Studio Multimedia Kreatif dan Microteaching Lab berada?",
      type: "MULTIPLE_CHOICE" as const,
      options: ["Lantai 7 (Fakultas Ilmu Pendidikan & Seni)", "Lantai 2", "Lantai 4", "Lantai 6"],
      correctAnswer: "Lantai 7 (Fakultas Ilmu Pendidikan & Seni)",
      explanation: "Lantai 7 adalah rumah bagi Fakultas Ilmu Pendidikan dan Studio Multimedia Kreatif.",
      baseScore: 25,
      tags: ["fip", "lantai7", "studio"],
    },
  ];

  for (const q of sampleQuestions) {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionText, q.questionText))
      .limit(1);

    if (!existing) {
      await db.insert(questions).values(q);
    } else {
      await db.update(questions).set(q).where(eq(questions.id, existing.id));
    }
  }
  console.log(`  ✅ ${sampleQuestions.length} Curated Questions active in Question Bank`);

  // 7. Seed Missions & Routes Mapping to 9 Floors
  console.log("Setting up Stage Routes and Missions for all 9 Floors...");
  const stage1 = createdStages.find((s) => s.order === 1) || createdStages[0];
  
  if (stage1 && mainQuizGame) {
    const [existingRoute] = await db
      .select()
      .from(routes)
      .where(eq(routes.name, "Rute Utama Ekspedisi 9 Lantai"))
      .limit(1);

    let mainRoute = existingRoute;
    if (!existingRoute) {
      [mainRoute] = await db
        .insert(routes)
        .values({
          name: "Rute Utama Ekspedisi 9 Lantai",
          stageId: stage1.id,
          status: "ACTIVE",
        })
        .returning();
    }

    // Attach route stops for each floor
    for (let fNum = 1; fNum <= 9; fNum++) {
      const posLoc = createdLocations.find((l) => l.code === `POS-L${fNum}-A`);
      if (posLoc && mainRoute) {
        const [existingStop] = await db
          .select()
          .from(routeStops)
          .where(and(eq(routeStops.routeId, mainRoute.id), eq(routeStops.order, fNum)))
          .limit(1);

        if (!existingStop) {
          await db.insert(routeStops).values({
            routeId: mainRoute.id,
            locationId: posLoc.id,
            order: fNum,
            isRequired: true,
            estimatedDurationMin: 15,
          });
        }

        // Attach mission for this pos
        const [existingMission] = await db
          .select()
          .from(missions)
          .where(eq(missions.locationId, posLoc.id))
          .limit(1);

        if (!existingMission) {
          await db.insert(missions).values({
            name: `Tantangan Kuis Pos Lantai ${fNum}`,
            description: `Selesaikan kuis wawasan dan uji kecerdasan tim di ${posLoc.name}`,
            type: "MAIN",
            locationId: posLoc.id,
            stageId: stage1.id,
            gameId: mainQuizGame.id,
            order: fNum,
            timeLimit: 120,
            status: "ACTIVE",
          });
        }
      }
    }
    console.log("  ✅ 9 Floor Routes & Quiz Missions attached to Stage 1");
  }

  // 8. Seed 50 Official Teams & Buddies Roster
  console.log("Creating 50 Official Teams (Genius 01 - Genius 50) & Official Buddies...");
  const buddyDefaultPassword = await hashPassword("buddy2026");

  for (const b of RAW_BUDDY_DATA) {
    const padNum = String(b.num).padStart(2, "0");
    const username = `buddy${padNum}`;
    const teamName = `Genius ${padNum}`;
    const teamCode = `GENIUS-${padNum}`;

    // Create or find Team
    const [existingT] = await db
      .select()
      .from(teams)
      .where(eq(teams.code, teamCode))
      .limit(1);

    let teamObj = existingT;
    if (!existingT) {
      [teamObj] = await db
        .insert(teams)
        .values({
          name: teamName,
          code: teamCode,
          status: "ACTIVE",
        })
        .returning();
    }

    // Create or find Buddy User
    const [existingB] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    let buddyObj = existingB;
    if (!existingB) {
      [buddyObj] = await db
        .insert(users)
        .values({
          username,
          passwordHash: buddyDefaultPassword,
          fullName: b.fullName,
          role: "BUDDY",
          status: "ACTIVE",
          gender: b.gender,
          avatarUrl: b.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png",
        })
        .returning();
    }

    // Link Buddy to Team
    if (teamObj && buddyObj) {
      const [existingLink] = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, teamObj.id), eq(teamMembers.userId, buddyObj.id)))
        .limit(1);

      if (!existingLink) {
        await db.insert(teamMembers).values({
          teamId: teamObj.id,
          userId: buddyObj.id,
          buddyRole: "PRIMARY",
        });
      }
    }

    // Assign sample participants to Genius 01
    if (b.num === 1 && teamObj) {
      for (const p of sampleParticipants) {
        await db
          .delete(teamMembers)
          .where(and(eq(teamMembers.userId, p.id), ne(teamMembers.teamId, teamObj.id)));

        const [pLink] = await db
          .select()
          .from(teamMembers)
          .where(and(eq(teamMembers.teamId, teamObj.id), eq(teamMembers.userId, p.id)))
          .limit(1);

        if (!pLink) {
          await db.insert(teamMembers).values({
            teamId: teamObj.id,
            userId: p.id,
          });
        }
      }
    }
  }
  console.log("  ✅ 50 Official Teams and Buddies mapped and assigned!");

  // 9. Seed Official 19 Ormawa Booths (Expo Hari 3)
  console.log("🎪 Seeding Official 19 Ormawa Booths (Expo Hari 3)...");
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
  console.log(`  ✅ ${officialOrmawa.length} Official Ormawa Booths seeded`);

  console.log("🎉 GENIUS 2026 Seeding Completed Successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
