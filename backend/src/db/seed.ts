import { db } from "./index";
import {
  users,
  teams,
  teamMembers,
  stages,
  floors,
  locations,
  games,
  missions,
  questions,
  achievements,
  ormawaBooths,
} from "./schema";
import { hashPassword } from "../lib/password";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("ðŸŒ± [Seed] Starting GENIUS 2026 Database Seeding...");

  // 1. Seed Floors (Lantai 1 - Lantai 9 Gedung Terpadu UNU Yogyakarta)
  console.log("ðŸ¢ Seeding 9 Floors of UNU Yogyakarta...");
  const floorData = [
    { number: 1, name: "Lantai 1: Lobby Utama & Student Center", description: "Pusat informasi, registrasi, dan aula penerimaan mahasiswa baru" },
    { number: 2, name: "Lantai 2: Perpustakaan & Digital Learning", description: "Pusat literasi, ruang baca modern, dan e-library" },
    { number: 3, name: "Lantai 3: Fakultas Teknologi Informasi", description: "Laboratorium AI, software engineering, dan data science" },
    { number: 4, name: "Lantai 4: Fakultas Industri Halal", description: "Laboratorium pangan halal, bioteknologi, dan standarisasi" },
    { number: 5, name: "Lantai 5: Fakultas Ekonomi & Bisnis Digital", description: "Inkubator startup, lab pasar modal, dan fintech" },
    { number: 6, name: "Lantai 6: Fakultas Studi Islam & Bahasa", description: "Kajian keislaman moderat dan pusat bahasa global" },
    { number: 7, name: "Lantai 7: Fakultas Ilmu Pendidikan & Seni", description: "Micro-teaching lab, studio media kreatif, dan seni budaya" },
    { number: 8, name: "Lantai 8: Rektorat & Pusat Inovasi UNU", description: "Ruang senat, kantor pimpinan, dan partnership hub" },
    { number: 9, name: "Lantai 9: Convention Hall & Sky Garden", description: "Auditorium utama grand ceremony dan observatorium" },
  ];

  let createdFloors = await db.select().from(floors);
  if (createdFloors.length === 0) {
    createdFloors = await db.insert(floors).values(floorData).returning();
  }

  // 2. Seed Locations with QR Tokens
  console.log("ðŸ“ Seeding Pos Lokasi & QR Code Tokens...");
  let createdLocations = await db.select().from(locations);
  if (createdLocations.length === 0) {
    const locationInserts: any[] = [];
    for (const fl of createdFloors) {
      locationInserts.push(
        {
          floorId: fl.id,
          name: `Pos ${fl.name} - Zona A`,
          code: `POS-L${fl.number}-A`,
          description: `Pos eksplorasi dan mini game zona barat Lantai ${fl.number}`,
          qrToken: `UNU-QR-L${fl.number}-ZONA-A-${crypto.randomUUID().slice(0, 8)}`,
          maxCapacity: 50,
          currentOccupancy: 0,
          status: "AVAILABLE" as const,
        },
        {
          floorId: fl.id,
          name: `Pos ${fl.name} - Zona B`,
          code: `POS-L${fl.number}-B`,
          description: `Pos tantangan kolaborasi zona timur Lantai ${fl.number}`,
          qrToken: `UNU-QR-L${fl.number}-ZONA-B-${crypto.randomUUID().slice(0, 8)}`,
          maxCapacity: 50,
          currentOccupancy: 0,
          status: "AVAILABLE" as const,
        }
      );
    }
    createdLocations = await db.insert(locations).values(locationInserts).returning();
  }

  // 3. Seed Stages
  console.log("ðŸš© Seeding 5 Stages Event GENIUS 2026...");
  let createdStages = await db.select().from(stages);
  if (createdStages.length === 0) {
    const stageData = [
      { order: 1, name: "Stage 1: Orientasi & Pembukaan", description: "Pengenalan nilai-nilai ke-NU-an, visi kampus, dan pembentukan regu", status: "ACTIVE" as const },
      { order: 2, name: "Stage 2: Penjelajahan 9 Lantai", description: "Eksplorasi seluruh fakultas dan laboratorium terpadu", status: "UPCOMING" as const },
      { order: 3, name: "Stage 3: Kolaborasi & Teamwork", description: "Uji kekompakan regu dalam menyelesaikan teka-teki interdisiplin", status: "UPCOMING" as const },
      { order: 4, name: "Stage 4: Inovasi & Tantangan Digital", description: "Hackathon mini dan pemecahan kasus berbasis teknologi AI", status: "UPCOMING" as const },
      { order: 5, name: "Stage 5: Grand Finale & Penobatan", description: "Penghitungan leaderboard akhir dan penobatan Juara GENIUS 2026", status: "UPCOMING" as const },
    ];
    createdStages = await db.insert(stages).values(stageData).returning();
  }

  // 4. Seed Games
  console.log("ðŸŽ® Seeding 5 Mini Games Engine...");
  let createdGames = await db.select().from(games);
  if (createdGames.length === 0) {
    const gameData = [
      {
        name: "Campus Trivia UNU",
        type: "QUIZ" as const,
        description: "Kuis kilat wawasan sejarah UNU Yogyakarta, pahlawan nasional, dan nilai Aswaja",
        config: { questionsCount: 5, timeLimitPerQuestion: 15, allowSkip: false },
      },
      {
        name: "Cyber Decoder",
        type: "PUZZLE" as const,
        description: "Dekripsi sinyal biner dan teka-teki logika kriptografi sandi kampus",
        config: { targetLength: 6, maxErrors: 3, difficulty: "MEDIUM" },
      },
      {
        name: "Memory Matrix",
        type: "MEMORY" as const,
        description: "Uji daya ingat pola matriks simbol sains & teknologi",
        config: { gridSize: 4, sequenceLength: 5, roundCount: 3 },
      },
      {
        name: "Speed Reflex Tap",
        type: "REACTION" as const,
        description: "Uji kecepatan refleks sentuhan visual target energi kampus",
        config: { targetCount: 20, speedMultiplier: 1.2 },
      },
      {
        name: "Logic Circuit Flow",
        type: "LOGIC" as const,
        description: "Merangkai aliran gerbang logika AI untuk mengaktifkan server lantai",
        config: { gatesCount: 4, maxTries: 5, difficulty: "HARD" },
      },
    ];
    createdGames = await db.insert(games).values(gameData).returning();
  }

  // 5. Seed Missions
  console.log("ðŸŽ¯ Seeding Campus Missions...");
  const existingMissions = await db.select().from(missions);
  if (existingMissions.length === 0 && createdLocations.length > 0 && createdStages.length > 0 && createdGames.length > 0) {
    const missionInserts: any[] = [];
    createdLocations.slice(0, 8).forEach((loc, idx) => {
      const g = createdGames[idx % createdGames.length];
      missionInserts.push({
        name: `Misi Pos ${idx + 1}: ${g.name}`,
        description: `Tantangan mini game ${g.name} di ${loc.name}`,
        type: "MAIN",
        locationId: loc.id,
        stageId: createdStages[0].id,
        gameId: g.id,
        order: idx + 1,
        isRequired: true,
        timeLimit: 300,
        status: "ACTIVE" as const,
      });
    });
    await db.insert(missions).values(missionInserts);
  }

  // 6. Seed Achievements (Titles & Badges)
  console.log("ðŸ† Seeding RPG Achievements & Title Upgrades...");
  const existingAchievements = await db.select().from(achievements);
  if (existingAchievements.length === 0) {
    const achievementData = [
      {
        name: "Langkah Pertama",
        title: "Novice Adventurer",
        description: "Menyelesaikan misi pos pertama dalam petualangan kampus",
        condition: { type: "MISSIONS_COMPLETED", count: 1 },
        icon: "boot-outline",
      },
      {
        name: "Penjelajah 9 Lantai",
        title: "Master Navigator",
        description: "Mengunjungi minimal 1 pos di setiap 9 lantai Gedung UNU",
        condition: { type: "FLOORS_EXPLORED", count: 9 },
        icon: "compass-outline",
      },
      {
        name: "Otak Brilian AI",
        title: "Cyber Alchemist",
        description: "Meraih skor sempurna 100% pada kuis logika dan kecerdasan buatan",
        condition: { type: "PERFECT_SCORE_GAMES", count: 3 },
        icon: "sparkles",
      },
      {
        name: "Sahabat Solid",
        title: "Pilar Regu Sejati",
        description: "Menerima bonus apresiasi kekompakan dari Buddy pendamping",
        condition: { type: "BUDDY_BONUS_RECEIVED", count: 2 },
        icon: "heart-handshake",
      },
      {
        name: "Sang Legenda Kampus",
        title: "Grand Archon UNU 2026",
        description: "Mencapai total akumulasi lebih dari 500 poin di leaderboard",
        condition: { type: "TOTAL_SCORE", threshold: 500 },
        icon: "trophy-award",
      },
    ];
    await db.insert(achievements).values(achievementData);
  }

  // 7. Seed Question Bank
  console.log("â“ Seeding Question Bank...");
  const existingQuestions = await db.select().from(questions);
  if (existingQuestions.length === 0) {
    const questionData = [
      {
        category: "Kampus UNU",
        difficulty: "EASY" as const,
        questionText: "Gedung kampus terpadu Universitas Nahdlatul Ulama (UNU) Yogyakarta memiliki berapa lantai?",
        type: "MULTIPLE_CHOICE" as const,
        options: ["7 Lantai", "8 Lantai", "9 Lantai", "10 Lantai"],
        correctAnswer: "9 Lantai",
        explanation: "Gedung terpadu UNU Yogyakarta memiliki 9 lantai dengan fasilitas perkuliahan, laboratorium riset, dan convention hall modern.",
        baseScore: 10,
      },
      {
        category: "Kampus UNU",
        difficulty: "EASY" as const,
        questionText: "Organisasi induk keagamaan yang menaungi berdirinya UNU Yogyakarta adalah...",
        type: "MULTIPLE_CHOICE" as const,
        options: ["Muhammadiyah", "Nahdlatul Ulama", "Persis", "Al-Washliyah"],
        correctAnswer: "Nahdlatul Ulama",
        explanation: "UNU Yogyakarta didirikan di bawah naungan Pengurus Besar Nahdlatul Ulama (PBNU).",
        baseScore: 10,
      },
      {
        category: "Teknologi & AI",
        difficulty: "MEDIUM" as const,
        questionText: "Cabang ilmu kecerdasan buatan yang mempelajari pemahaman dan pengolahan bahasa manusia disebut...",
        type: "MULTIPLE_CHOICE" as const,
        options: ["Computer Vision", "Natural Language Processing (NLP)", "Reinforcement Learning", "Edge Computing"],
        correctAnswer: "Natural Language Processing (NLP)",
        explanation: "NLP adalah bidang AI yang berfokus pada interaksi antara komputer dan bahasa alami manusia.",
        baseScore: 15,
      },
      {
        category: "Kampus UNU",
        difficulty: "MEDIUM" as const,
        questionText: "Prinsip dasar keislaman yang dijunjung tinggi oleh sivitas akademika UNU Yogyakarta adalah...",
        type: "MULTIPLE_CHOICE" as const,
        options: ["Ahlussunnah wal Jama'ah An-Nahdliyah", "Sekulerisme", "Pragmatisme", "Eksklusivisme"],
        correctAnswer: "Ahlussunnah wal Jama'ah An-Nahdliyah",
        explanation: "Aswaja An-Nahdliyah menjunjung tinggi moderasi (tawassuth), keseimbangan (tawazun), keadilan (i'tidal), dan toleransi (tasamuh).",
        baseScore: 15,
      },
      {
        category: "Teknologi & AI",
        difficulty: "HARD" as const,
        questionText: "Dalam arsitektur model transformer AI, mekanisme utama yang memungkinkan pemrosesan relasi antar token secara paralel disebut...",
        type: "MULTIPLE_CHOICE" as const,
        options: ["Self-Attention Mechanism", "Convolution Layer", "Recurrent Gate", "Pooling Layer"],
        correctAnswer: "Self-Attention Mechanism",
        explanation: "Mekanisme Self-Attention memungkinkan transformer menghitung bobot keterkaitan antar semua token dalam input sequence sekaligus.",
        baseScore: 20,
      },
    ];
    await db.insert(questions).values(questionData);
  }

  // 8. Seed Core Users (Admin, Buddies, Teams, Participants)
  console.log("ðŸ‘¥ Seeding Core System Users & RPG Characters...");
  const adminPasswordHash = await hashPassword("KopDesMBG!2026");
  const buddyPasswordHash = await hashPassword("buddy2026");
  const userPasswordHash = await hashPassword("genius2026");

  // Upsert or Ensure Admin User exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN" as const,
      fullName: "Administrator GENIUS",
      gender: "MALE",
      characterClass: "CYBER_KNIGHT",
      characterTitle: "Grand Archon UNU 2026",
      characterTier: 3,
      unlockedTitles: ["Grand Archon UNU 2026", "Novice Adventurer"],
    });
  } else {
    // Update admin password to KopDesMBG!2026
    await db.update(users).set({ passwordHash: adminPasswordHash }).where(eq(users.username, "admin"));
  }

  // Buddies
  const existingBuddy1 = await db.select().from(users).where(eq(users.username, "buddy_budi"));
  if (existingBuddy1.length === 0) {
    await db.insert(users).values([
      {
        username: "buddy_budi",
        passwordHash: buddyPasswordHash,
        role: "BUDDY" as const,
        fullName: "Budi Santoso (Buddy)",
        gender: "MALE",
        characterClass: "MECHA_PALADIN",
        characterTitle: "Pilar Regu Sejati",
        characterTier: 2,
        unlockedTitles: ["Pilar Regu Sejati", "Novice Adventurer"],
      },
      {
        username: "buddy01",
        passwordHash: buddyPasswordHash,
        role: "BUDDY" as const,
        fullName: "Budi Santoso (Buddy)",
        gender: "MALE",
        characterClass: "MECHA_PALADIN",
        characterTitle: "Pilar Regu Sejati",
        characterTier: 2,
        unlockedTitles: ["Pilar Regu Sejati", "Novice Adventurer"],
      },
      {
        username: "buddy_ahmad",
        passwordHash: buddyPasswordHash,
        role: "BUDDY" as const,
        fullName: "Ahmad Fauzi (Buddy)",
        gender: "MALE",
        characterClass: "MECHA_PALADIN",
        characterTitle: "Pilar Regu Sejati",
        characterTier: 2,
        unlockedTitles: ["Pilar Regu Sejati", "Novice Adventurer"],
      },
      {
        username: "buddy_siti",
        passwordHash: buddyPasswordHash,
        role: "BUDDY" as const,
        fullName: "Siti Nurhaliza (Buddy)",
        gender: "FEMALE",
        characterClass: "TECH_MAGE",
        characterTitle: "Master Navigator",
        characterTier: 2,
        unlockedTitles: ["Master Navigator", "Novice Adventurer"],
      },
    ]);
  }

  // 7. Seed Ormawa / UKM Expo Booths & PICs
  console.log("ðŸŽª Seeding Ormawa / UKM Expo Booths & PICs...");
  const existingBooths = await db.select().from(ormawaBooths);
  if (existingBooths.length === 0) {
    const fl3 = createdFloors.find((f) => f.number === 3)?.id;
    const fl4 = createdFloors.find((f) => f.number === 4)?.id;
    const fl5 = createdFloors.find((f) => f.number === 5)?.id;

    // Seed PICs
    const picPasswordHash = await hashPassword("genius2026");
    const picInserts = [
      {
        username: "pic-pagar-nusa",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC PSNU Pagar Nusa",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-robotika-iot",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC Robotics & AI",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-gita-nusantara",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC PSM Gita Nusantara",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-teater-titiknol",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC Teater Titik Nol",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-ksr-pmi",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC KSR PMI UNU",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-mapala-cakrawala",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC MAPALA Cakrawala",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-futsal-unu",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC Futsal & Football Club",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-badminton-unu",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC Badminton Club",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-lpim-jurnalistik",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC LPM Poros",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-forum-riset",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC Forum Riset Kampus",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-pmii-rayon",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC PMII Rayon UNU",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
      {
        username: "pic-english-debate",
        passwordHash: picPasswordHash,
        role: "ORMAWA_PIC" as const,
        fullName: "PIC UNU English Club",
        gender: "MALE" as const,
        characterClass: "CYBER_KNIGHT" as const,
        characterTitle: "Ormawa PIC",
        characterTier: 1,
      },
    ];
    const createdPics = await db.insert(users).values(picInserts).returning();

    // Link PIC to booths and seed booths
    await db.insert(ormawaBooths).values([
      {
        code: "ORMAWA-PAGAR-NUSA",
        name: "Pencak Silat Nahdlatul Ulama Pagar Nusa",
        shortName: "PSNU Pagar Nusa",
        category: "BELA_DIRI",
        floorId: fl3,
        boothNumber: "E3-01",
        description: "Wadah penggemblengan mental, spiritual, dan fisik pesilat berakhlak mulia berlandaskan ajaran Ahlussunnah wal Jamaah An-Nahdliyyah.",
        qrCode: "UNU-ORMAWA-PAGAR-NUSA-2026",
        xpReward: 2,
        badgeIcon: "Shield",
        badgeColor: "#166534",
        contactPerson: "Kang Hasan (0812-3456-7890)",
        instagram: "@pagarnusa.unuyogya",
        picUserId: createdPics[0].id,
        isActive: true,
      },
      {
        code: "ORMAWA-ROBOTIKA-IOT",
        name: "Genius Robotics & AI Club",
        shortName: "Robotics & AI",
        category: "TEKNOLOGI",
        floorId: fl3,
        boothNumber: "E3-02",
        description: "Komunitas riset robotika, otomatisasi sistem, embedded electronics, dan penerapan machine learning untuk kompetisi nasional KRI & Gemastik.",
        qrCode: "UNU-ORMAWA-ROBOTIKA-2026",
        xpReward: 2,
        badgeIcon: "Cpu",
        badgeColor: "#0284c7",
        contactPerson: "Mas Farhan (0813-8899-1122)",
        instagram: "@robotics.unu",
        picUserId: createdPics[1].id,
        isActive: true,
      },
      {
        code: "ORMAWA-GITA-NUSANTARA",
        name: "Paduan Suara Mahasiswa Gita Nusantara",
        shortName: "PSM Gita Nusantara",
        category: "SENI_BUDAYA",
        floorId: fl3,
        boothNumber: "E3-03",
        description: "Paduan suara resmi universitas yang membawakan lagu-lagu nasional, shalawat kontemporer, dan folklore Nusantara.",
        qrCode: "UNU-ORMAWA-GITA-NUSANTARA-2026",
        xpReward: 2,
        badgeIcon: "MusicNotes",
        badgeColor: "#d97706",
        contactPerson: "Mbak Cindy (0856-7788-9900)",
        instagram: "@psm.gitanusantara",
        picUserId: createdPics[2].id,
        isActive: true,
      },
      {
        code: "ORMAWA-TEATER-TITIKNOL",
        name: "Sanggar Teater Titik Nol",
        shortName: "Teater Titik Nol",
        category: "SENI_BUDAYA",
        floorId: fl3,
        boothNumber: "E3-04",
        description: "Eksplorasi seni peran, monolog, tata artistik panggung, penulisan naskah drama, dan sastra kritis santri.",
        qrCode: "UNU-ORMAWA-TEATER-2026",
        xpReward: 2,
        badgeIcon: "MasksTheater",
        badgeColor: "#7c3aed",
        contactPerson: "Bung Bayu (0878-1122-3344)",
        instagram: "@teatertitiknol.unu",
        picUserId: createdPics[3].id,
        isActive: true,
      },
      {
        code: "ORMAWA-KSR-PMI",
        name: "Korps Sukarela Palang Merah Indonesia Unit UNU",
        shortName: "KSR PMI UNU",
        category: "SOSIAL_KEMANUSIAAN",
        floorId: fl4,
        boothNumber: "E4-01",
        description: "Unit pertolongan pertama, penanggulangan darurat bencana, donor darah sukarela kampus, dan pengabdian medis masyarakat.",
        qrCode: "UNU-ORMAWA-KSR-PMI-2026",
        xpReward: 2,
        badgeIcon: "FirstAid",
        badgeColor: "#dc2626",
        contactPerson: "Nadia (0821-4455-6677)",
        instagram: "@ksrpmi.unu",
        picUserId: createdPics[4].id,
        isActive: true,
      },
      {
        code: "ORMAWA-MAPALA-CAKRAWALA",
        name: "Mahasiswa Pecinta Alam Cakrawala UNU",
        shortName: "MAPALA Cakrawala",
        category: "SOSIAL_KEMANUSIAAN",
        floorId: fl4,
        boothNumber: "E4-02",
        description: "Organisasi penggiat alam bebas, konservasi lingkungan hidup, caving, panjat tebing, dan navigasi darat rimba gunung.",
        qrCode: "UNU-ORMAWA-MAPALA-2026",
        xpReward: 2,
        badgeIcon: "Mountains",
        badgeColor: "#15803d",
        contactPerson: "Komo Cakrawala (0899-5566-7788)",
        instagram: "@mapala.cakrawala",
        picUserId: createdPics[5].id,
        isActive: true,
      },
      {
        code: "ORMAWA-FUTSAL-UNU",
        name: "UKM Futsal & Sepakbola UNU Yogyakarta",
        shortName: "Futsal & Football Club",
        category: "OLAHRAGA",
        floorId: fl4,
        boothNumber: "E4-03",
        description: "Wadah pengembangan bakat dan taktik olahraga futsal mahasiswa untuk kejuaraan antar perguruan tinggi se-DIY dan nasional.",
        qrCode: "UNU-ORMAWA-FUTSAL-2026",
        xpReward: 2,
        badgeIcon: "SoccerBall",
        badgeColor: "#ea580c",
        contactPerson: "Kapten Dimas (0812-9988-7766)",
        instagram: "@futsalunu.official",
        picUserId: createdPics[6].id,
        isActive: true,
      },
      {
        code: "ORMAWA-BADMINTON-UNU",
        name: "Badminton Club UNU Yogyakarta",
        shortName: "Badminton Club",
        category: "OLAHRAGA",
        floorId: fl4,
        boothNumber: "E4-04",
        description: "Klub bulutangkis santai dan prestasi untuk kategori tunggal maupun ganda putra, putri, dan campuran.",
        qrCode: "UNU-ORMAWA-BADMINTON-2026",
        xpReward: 2,
        badgeIcon: "Ticket",
        badgeColor: "#059669",
        contactPerson: "Iqbal (0822-3344-5566)",
        instagram: "@badminton.unuyk",
        picUserId: createdPics[7].id,
        isActive: true,
      },
      {
        code: "ORMAWA-LPIM-JURNALISTIK",
        name: "Lembaga Pers & Jurnalistik Mahasiswa UNU",
        shortName: "LPM Poros",
        category: "PENALARAN_KEISLAMAN",
        floorId: fl5,
        boothNumber: "E5-01",
        description: "Pers mahasiswa independen penyedia berita investigasi kampus, majalah digital, podcast santri, dan fotografi jurnalistik.",
        qrCode: "UNU-ORMAWA-PERS-2026",
        xpReward: 2,
        badgeIcon: "Newspaper",
        badgeColor: "#0891b2",
        contactPerson: "Redaktur Arif (0857-4433-2211)",
        instagram: "@lpmporos.unu",
        picUserId: createdPics[8].id,
        isActive: true,
      },
      {
        code: "ORMAWA-FORUM-RISET",
        name: "Forum Riset & Sains Santri Cendekia",
        shortName: "Forum Riset Kampus",
        category: "PENALARAN_KEISLAMAN",
        floorId: fl5,
        boothNumber: "E5-02",
        description: "Komunitas bimbingan intensif Program Kreativitas Mahasiswa (PKM), penulisan karya tulis ilmiah, dan jurnal scopus.",
        qrCode: "UNU-ORMAWA-RISET-2026",
        xpReward: 2,
        badgeIcon: "FlaskConical",
        badgeColor: "#4338ca",
        contactPerson: "Dr. Ilham (0811-2233-4455)",
        instagram: "@riset.unu",
        picUserId: createdPics[9].id,
        isActive: true,
      },
      {
        code: "ORMAWA-PMII-RAYON",
        name: "Pergerakan Mahasiswa Islam Indonesia (PMII) Rayon UNU",
        shortName: "PMII Rayon UNU",
        category: "PENALARAN_KEISLAMAN",
        floorId: fl5,
        boothNumber: "E5-03",
        description: "Gerakan mahasiswa kaderisasi Aswaja An-Nahdliyyah, intelektualitas pergerakan, dan advokasi sosial kemasyarakatan.",
        qrCode: "UNU-ORMAWA-PMII-2026",
        xpReward: 2,
        badgeIcon: "Flag",
        badgeColor: "#1e3a8a",
        contactPerson: "Sahabat Ridwan (0877-6655-4433)",
        instagram: "@pmii.unuyogya",
        picUserId: createdPics[10].id,
        isActive: true,
      },
      {
        code: "ORMAWA-ENGLISH-DEBATE",
        name: "English Debate & MUN Society",
        shortName: "UNU English Club",
        category: "PENALARAN_KEISLAMAN",
        floorId: fl5,
        boothNumber: "E5-04",
        description: "Klub debat parlementer bahasa Inggris, Model United Nations (MUN), public speaking, dan workshop IELTS santri.",
        qrCode: "UNU-ORMAWA-ENGLISH-2026",
        xpReward: 2,
        badgeIcon: "Globe",
        badgeColor: "#b45309",
        contactPerson: "Mbak Sarah (0819-2244-6688)",
        instagram: "@unuec.society",
        picUserId: createdPics[11].id,
        isActive: true,
      },
    ]);
  }

  // 12. Seed Official Quiz Database (9 Pos dari quiz_database.csv)
  try {
    const { seedOfficialQuizDatabase } = await import("../../scripts/seed_official_quiz");
    await seedOfficialQuizDatabase();
  } catch (err: any) {
    console.warn("⚠️ [Seed] Official quiz database seed warning:", err.message);
  }

  console.log('✅ [Seed] Database successfully seeded and verified!');
}

// Run standalone if executed directly via bun
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Seed] Error seeding database:', err);
      process.exit(1);
    });
}
