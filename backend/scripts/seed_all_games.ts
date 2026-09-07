import { db } from "../src/db";
import { games } from "../src/db/schema";
import { eq } from "drizzle-orm";

export const allGameDefinitions = [
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

async function seedAllGames() {
  console.log("🎮 Starting Full Game Catalog Seed into PostgreSQL...");

  // Also handle legacy names so they map gracefully
  const legacyMap: Record<string, string> = {
    "Team Quiz Challenge": "Team Quiz Challenge — Wawasan Kampus & Aswaja",
    "Speed Reaction Blitz": "Speed Reaction Blitz — Cyber Reflex Tap",
    "Memory Match Pairs": "Memory Match Matrix — Lambang & Fasilitas UNU",
  };

  for (const [legacyName, newName] of Object.entries(legacyMap)) {
    const [existingLegacy] = await db
      .select()
      .from(games)
      .where(eq(games.name, legacyName))
      .limit(1);

    if (existingLegacy) {
      console.log(`  🔄 Renaming legacy game "${legacyName}" -> "${newName}"`);
      await db
        .update(games)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(games.id, existingLegacy.id));
    }
  }

  const results = [];
  for (const def of allGameDefinitions) {
    const [existing] = await db
      .select()
      .from(games)
      .where(eq(games.name, def.name))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(games)
        .set({
          description: def.description,
          instructions: def.instructions,
          type: def.type,
          config: def.config,
          questionBankCategory: def.questionBankCategory,
          minPlayers: def.minPlayers,
          maxPlayers: def.maxPlayers,
          status: def.status,
          updatedAt: new Date(),
        })
        .where(eq(games.id, existing.id))
        .returning();
      results.push(updated);
      console.log(`  ✅ Updated existing game: [${def.type}] ${def.name}`);
    } else {
      const [inserted] = await db
        .insert(games)
        .values(def)
        .returning();
      results.push(inserted);
      console.log(`  ✨ Inserted new game: [${def.type}] ${def.name}`);
    }
  }

  console.log(`\n🎉 Completed! Total ${results.length} games registered in Database.`);
  process.exit(0);
}

seedAllGames().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
