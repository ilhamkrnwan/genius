import { db } from "../src/db";
import {
  floors,
  locations,
  games,
  missions,
  stages,
  questions,
} from "../src/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function seedOfficialQuizDatabase() {
  console.log("🚀 [SEEDER] Memulai seeding data kuis resmi GENIUS UNU 2026...");

  // 1. Seed Floors (Lantai 1 - 9)
  console.log("🏢 1. Seeding Floors (Gedung 9 Lantai)...");
  const floorDefinitions = [
    { number: 1, name: "Lantai 1 — Welcome Hall & Karakter Kampus", description: "Lobby kedatangan, integritas, dan anti-korupsi" },
    { number: 2, name: "Lantai 2 — Leadership & Media Komunikasi", description: "Kepemimpinan inklusif dan etika komunikasi digital" },
    { number: 3, name: "Lantai 3 — Profil Pelajar Pancasila", description: "Dimensi kemandirian, gotong royong, dan nalar kritis" },
    { number: 4, name: "Lantai 4 — Ketahanan Diri & Observasi Kampus", description: "Kampus sehat bebas narkoba dan observasi fasilitas" },
    { number: 5, name: "Lantai 5 — Integritas Akademik & Riset", description: "Kaidah sitasi, daftar pustaka, dan anti plagiarisme" },
    { number: 6, name: "Lantai 6 — Fun Pos & Orientasi Fasilitas", description: "Kreativitas tim dan navigasi seluruh lantai gedung" },
    { number: 7, name: "Lantai 7 — Laboratorium Robotika & Sains Hijau", description: "Inovasi teknologi modern dan rekayasa sains hijau" },
    { number: 8, name: "Lantai 8 — Riset Pascasarjana & Publikasi", description: "Kajian multidisipliner dan publikasi ilmiah global" },
    { number: 9, name: "Lantai 9 — Convention Hall & Sky Garden", description: "Convention hall utama dan rooftop hijau kontemplatif" },
  ];

  const floorMap = new Map<number, string>(); // floorNumber -> uuid
  for (const f of floorDefinitions) {
    let [existing] = await db.select().from(floors).where(eq(floors.number, f.number)).limit(1);
    if (!existing) {
      [existing] = await db.insert(floors).values(f).returning();
      console.log(`   + Lantai ${f.number} dibuat.`);
    }
    floorMap.set(f.number, existing.id);
  }

  // 2. Ensure Stages (Day 2 Campus Quest Stage)
  console.log("📅 2. Verifikasi Stage Pelaksanaan (Day 2 Campus Quest)...");
  let [stage] = await db.select().from(stages).where(eq(stages.order, 2)).limit(1);
  if (!stage) {
    [stage] = await db.select().from(stages).limit(1);
  }
  if (!stage) {
    [stage] = await db.insert(stages).values({
      name: "Day 2 — 9-Floor Campus Quest",
      description: "Eksplorasi 6 lantai dengan 9 pos tantangan gamifikasi resmi",
      order: 2,
      status: "ACTIVE",
    }).returning();
    console.log("   + Stage Day 2 dibuat.");
  }

  // 3. Seed Official Locations (9 Pos Resmi)
  console.log("📍 3. Seeding Official Pos Locations...");
  const posLocations = [
    { code: "POS-L1-1", name: "Pos 1: Anti Korupsi & Terorisme", floorNumber: 1, type: "ACADEMIC", description: "Lobby Utama Lantai 1" },
    { code: "POS-L2-2", name: "Pos 2: Leadership & Problem Solving", floorNumber: 2, type: "LAB", description: "Selasar Kepemimpinan Lantai 2" },
    { code: "POS-L2-6", name: "Pos 6: Media Sosial & Komunikasi", floorNumber: 2, type: "STUDY_AREA", description: "Area Literasi Digital Lantai 2" },
    { code: "POS-L3-3", name: "Pos 3: Profil Pelajar Pancasila", floorNumber: 3, type: "ACADEMIC", description: "Ruang Wawasan Kebangsaan Lantai 3" },
    { code: "POS-L4-4", name: "Pos 4: Kampus Bersinar Bebas Narkoba", floorNumber: 4, type: "STUDENT_LOUNGE", description: "Posko Kesehatan Kampus Lantai 4" },
    { code: "POS-L4-9", name: "Pos 9: Ingat Aku (Teks Blur & 3 Tokoh NU)", floorNumber: 4, type: "STUDY_AREA", description: "Mural Galeri Tokoh Lantai 4" },
    { code: "POS-L5-5", name: "Pos 5: Anti Plagiarisme & Integritas", floorNumber: 5, type: "LIBRARY", description: "Perpustakaan & Pusat Sitasi Lantai 5" },
    { code: "POS-L6-7", name: "Pos 7: Fun Pos Tebak Gambar & Audio", floorNumber: 6, type: "COMMON_SPACE", description: "Studio Rekreasi Maba Lantai 6" },
    { code: "POS-L6-8", name: "Pos 8: Ingat Aku (Tebak Posisi Lokasi Lantai)", floorNumber: 6, type: "COMMON_SPACE", description: "Area Orientasi Navigasi Lantai 6" },
  ];

  const locationMap = new Map<string, string>(); // code -> uuid
  for (const loc of posLocations) {
    const floorId = floorMap.get(loc.floorNumber)!;
    let [existing] = await db.select().from(locations).where(eq(locations.code, loc.code)).limit(1);
    if (!existing) {
      [existing] = await db.insert(locations).values({
        code: loc.code,
        name: loc.name,
        description: loc.description,
        floorId,
        type: loc.type as any,
        capacity: 50,
        status: "AVAILABLE",
      }).returning();
      console.log(`   + Lokasi ${loc.code} dibuat.`);
    } else {
      await db.update(locations).set({ name: loc.name, floorId }).where(eq(locations.id, existing.id));
    }
    locationMap.set(loc.code, existing.id);
  }

  // 4. Seed Official Core Games (9 Pos Games + Special Features)
  console.log("🎮 4. Seeding Core Game Engines (12 Games)...");
  const gameTemplates = [
    {
      name: "Pos 1 — Studi Kasus Integritas & Anti Korupsi",
      type: "QUIZ" as const,
      description: "Tantangan 8 studi kasus pilihan ganda menguji integritas pengelolaan dana, whistleblowing, dan pencegahan intoleransi.",
      instructions: "Pilih tindakan paling tepat untuk setiap dilema etika kampus sebelum waktu habis.",
      config: {
        totalQuestions: 8,
        questionsCount: 8,
        timeLimitSeconds: 120,
        timeLimitPerQuestion: 15,
        maxScore: 100,
        scoringMap: [13, 12, 13, 12, 13, 12, 13, 12],
      },
      questionBankCategory: "Anti Korupsi dan Terorisme",
    },
    {
      name: "Pos 2 — Leadership Memory Match",
      type: "MEMORY" as const,
      description: "Mencocokkan 5 pasangan kartu konsep kepemimpinan dengan tindakan nyata pemecahan masalah di organisasi.",
      instructions: "Balik kartu secara berurutan dan pasangkan prinsip leadership dengan solusi kasus praktisnya!",
      config: {
        totalPairs: 5,
        timeLimitSeconds: 90,
        maxScore: 100,
        pairs: [
          { id: "p1", labelA: "Integritas", labelB: "Jujur dan konsisten antara perkataan dan perbuatan", score: 15, tag: "KARAKTER" },
          { id: "p2", labelA: "Delegasi", labelB: "Breakdown tugas menjadi bagian kecil & bagi peran sesuai keahlian", score: 20, tag: "MANAJEMEN" },
          { id: "p3", labelA: "Penanganan Anggota Numpang Nama", labelB: "Kasih deadline & tenggat tegas, kalau tetep ghosting baru lapor dosen", score: 25, tag: "TEAMWORK" },
          { id: "p4", labelA: "Visioner", labelB: "Punya Pandangan Jauh Kedepan Untuk Organisasi", score: 15, tag: "PERENCANAAN" },
          { id: "p5", labelA: "Problem Solving", labelB: "Rundown acara mendadak berantakan karena mati listrik: Tetap tenang, alihkan ke ice breaking manual sambil backup teknis", score: 25, tag: "KEPUTUSAN" },
        ],
      },
      questionBankCategory: "Leadership",
    },
    {
      name: "Pos 3 — Benar atau Salah Pelajar Pancasila",
      type: "RAPID_ANSWER" as const,
      description: "Tantangan kilat evaluasi 5 pernyataan kritis terkait dimensi profil pelajar Pancasila & kemandirian mahasiswa.",
      instructions: "Tentukan apakah setiap pernyataan yang ditampilkan Benar atau Salah secara tepat dan cepat!",
      config: {
        statementCount: 5,
        timeLimitSeconds: 60,
        maxScore: 100,
        scoringMap: [15, 20, 20, 20, 25],
      },
      questionBankCategory: "Profil Pelajar Pancasila",
    },
    {
      name: "Pos 4 — TTS Kampus Bersinar Bebas Narkoba",
      type: "PUZZLE" as const,
      description: "Teka-teki silang 5 kata mendatar & menurun tentang kesadaran bahaya narkoba, rehabilitasi, dan penolakan ajakan adiktif.",
      instructions: "Pilih nomor soal TTS, baca petunjuk mendatar/menurun, lalu isi jawaban ke dalam kotak grid!",
      config: {
        gridRows: 10,
        gridCols: 10,
        timeLimitSeconds: 120,
        maxScore: 100,
        words: ["NARKOBA", "KETAGIHAN", "BEBAS", "REHAB", "TOLAK"],
      },
      questionBankCategory: "Anti Narkoba",
    },
    {
      name: "Pos 5 — Tebak Kata Siapakah Aku: Anti Plagiarisme",
      type: "WORD_GAME" as const,
      description: "Riddle akademis tebak kata: identifikasi istilah penting seputar orisinalitas karya, sitasi, referensi, dan integritas.",
      instructions: "Baca petunjuk definisi 'Siapakah aku?', lalu susun huruf jawaban dengan benar sebelum batas waktu!",
      config: {
        totalWords: 5,
        timeLimitSeconds: 90,
        maxScore: 100,
        scoringMap: [10, 20, 20, 25, 25],
      },
      questionBankCategory: "Anti Plagiarisme",
    },
    {
      name: "Pos 6 — Media Sosial & Komunikasi Efektif",
      type: "QUIZ" as const,
      description: "Tantangan etika bermedia sosial, literasi informasi, dan komunikasi santun civitas akademika.",
      instructions: "Jawab pertanyaan singkat dan analisis kasus etika komunikasi digital secara tepat!",
      config: {
        totalQuestions: 8,
        questionsCount: 8,
        timeLimitSeconds: 90,
        timeLimitPerQuestion: 15,
        maxScore: 100,
        scoringMap: [13, 12, 13, 12, 13, 12, 13, 12],
      },
      questionBankCategory: "Media Sosial dan Komunikasi",
    },
    {
      name: "Pos 7 — Fun Pos Tebak Gambar & Audio",
      type: "IMAGE_GUESS" as const,
      description: "Tantangan tebak visual gambar dan kreativitas pengamatan mahasiswa baru dengan dukungan Google Drive iframe.",
      instructions: "Amati petunjuk visual yang terbuka di layar dan tebak objek atau makna di baliknya!",
      config: {
        totalQuestions: 5,
        timeLimitSeconds: 60,
        maxScore: 100,
        useIframeEmbed: true,
      },
      questionBankCategory: "Fun Pos",
    },
    {
      name: "Pos 8 — Ingat Aku: Tebak Lokasi Lantai Gedung",
      type: "LOGIC" as const,
      description: "Tebak lokasi lantai berdasarkan 5 foto sudut fasilitas kampus UNU melalui Google Drive iframe tersemat.",
      instructions: "Perhatikan foto lokasi yang disajikan, lalu pilih di lantai berapakah ruangan tersebut berada!",
      config: {
        totalQuestions: 5,
        timeLimitSeconds: 60,
        maxScore: 100,
        scorePerQuestion: 20,
        useIframeEmbed: true,
      },
      questionBankCategory: "Ingat Aku - Posisi",
    },
    {
      name: "Pos 9 — Ingat Aku: Teks Blur & 3 Tokoh NU",
      type: "IMAGE_GUESS" as const,
      description: "Uji ketelitian membaca teks dinding kampus yang diblur dan sebutkan 3 tokoh pendiri NU secara urut.",
      instructions: "Baca teks samar pada gambar fasilitas kampus dan susun nama tokoh sejarah secara presisi!",
      config: {
        totalQuestions: 5,
        timeLimitSeconds: 90,
        maxScore: 100,
        scorePerQuestion: 20,
        useIframeEmbed: true,
      },
      questionBankCategory: "Ingat Aku - Tulisan",
    },
    {
      name: "Flappy Genius — Terbang Melampaui Nilai UNU",
      type: "FLAPPY_BIRD" as const,
      description: "Arcade retro pixel flyer: kendalikan maskot Genius melewati pilar-pilar nilai Aswaja & integritas kampus.",
      instructions: "Tap atau tekan tombol SPACE untuk terbang melompat melewati pilar rintangan!",
      config: { maxScore: 100, durationSeconds: 60 },
      questionBankCategory: "Arcade",
    },
    {
      name: "AI Drawing & Vision Art Curator",
      type: "IMAGE_GUESS" as const,
      description: "Tantangan melukis prompt kreatif dinilai langsung oleh AI Art Curator berbasis Google Gemini Vision.",
      instructions: "Goreskan kanvas digital sesuai instruksi kalimat prompt sebelum waktu habis!",
      config: { drawingTimeSeconds: 60, maxScore: 100 },
      questionBankCategory: "Kreativitas AI",
    },
    {
      name: "Kuis Balapan Regu — Fast Grand Prix UNU",
      type: "TEAM_CHALLENGE" as const,
      description: "Balapan kuis kooperatif antar regu. Jawaban benar dan cepat memacu laju kendaraan tim menuju garis akhir!",
      instructions: "Pilih jawaban benar bersama rekan regu untuk memicu turbo speed boost!",
      config: { lapsToWin: 5, maxScore: 150 },
      questionBankCategory: "Balapan Regu",
    },
  ];

  const gameMap = new Map<string, string>(); // name -> uuid
  for (const gt of gameTemplates) {
    let [existing] = await db.select().from(games).where(eq(games.name, gt.name)).limit(1);
    if (!existing) {
      [existing] = await db.insert(games).values({
        name: gt.name,
        type: gt.type as any,
        description: gt.description,
        instructions: gt.instructions,
        config: gt.config,
        questionBankCategory: gt.questionBankCategory,
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE",
      }).returning();
      console.log(`   + Game '${gt.name}' dibuat.`);
    } else {
      await db.update(games).set({
        type: gt.type as any,
        description: gt.description,
        instructions: gt.instructions,
        config: gt.config,
        questionBankCategory: gt.questionBankCategory,
        status: "ACTIVE",
      }).where(eq(games.id, existing.id));
    }
    gameMap.set(gt.name, existing.id);
  }

  // 5. Connect Missions (9 Pos Missions linked to Locations & Games)
  console.log("🎯 5. Menautkan Misi Kampus (9 Pos Resmi)...");
  const posMissionBindings = [
    { locCode: "POS-L1-1", gameName: "Pos 1 — Studi Kasus Integritas & Anti Korupsi", order: 1, timeLimit: 600 },
    { locCode: "POS-L2-2", gameName: "Pos 2 — Leadership Memory Match", order: 2, timeLimit: 600 },
    { locCode: "POS-L2-6", gameName: "Pos 6 — Media Sosial & Komunikasi Efektif", order: 3, timeLimit: 600 },
    { locCode: "POS-L3-3", gameName: "Pos 3 — Benar atau Salah Pelajar Pancasila", order: 4, timeLimit: 600 },
    { locCode: "POS-L4-4", gameName: "Pos 4 — TTS Kampus Bersinar Bebas Narkoba", order: 5, timeLimit: 600 },
    { locCode: "POS-L4-9", gameName: "Pos 9 — Ingat Aku: Teks Blur & 3 Tokoh NU", order: 6, timeLimit: 600 },
    { locCode: "POS-L5-5", gameName: "Pos 5 — Tebak Kata Siapakah Aku: Anti Plagiarisme", order: 7, timeLimit: 600 },
    { locCode: "POS-L6-7", gameName: "Pos 7 — Fun Pos Tebak Gambar & Audio", order: 8, timeLimit: 600 },
    { locCode: "POS-L6-8", gameName: "Pos 8 — Ingat Aku: Tebak Lokasi Lantai Gedung", order: 9, timeLimit: 600 },
  ];

  for (const b of posMissionBindings) {
    const locId = locationMap.get(b.locCode)!;
    const gameId = gameMap.get(b.gameName)!;

    let [existingMission] = await db.select().from(missions).where(eq(missions.locationId, locId)).limit(1);
    if (!existingMission) {
      [existingMission] = await db.insert(missions).values({
        name: `Tantangan ${b.locCode}: ${b.gameName}`,
        description: `Selesaikan tantangan di ${b.locCode} bersama rekan regumu`,
        type: "MAIN",
        locationId: locId,
        stageId: stage.id,
        gameId,
        order: b.order,
        isRequired: true,
        timeLimit: b.timeLimit,
        status: "ACTIVE",
      }).returning();
      console.log(`   + Misi ${b.locCode} terhubung.`);
    } else {
      await db.update(missions).set({
        name: `Tantangan ${b.locCode}: ${b.gameName}`,
        gameId,
        order: b.order,
        timeLimit: b.timeLimit,
        status: "ACTIVE",
      }).where(eq(missions.id, existingMission.id));
    }
  }

  // 6. Seed Bank Soal (Questions) dari quiz_database.csv
  console.log("❓ 6. Seeding Bank Soal Resmi (51 Soal dari quiz_database.csv)...");

  // Bersihkan pertanyaan pos resmi sebelumnya agar tidak ada soal usang/halusinasi
  const officialCategories = [
    "Anti Korupsi dan Terorisme",
    "Anti Korupsi & Terorisme",
    "Leadership",
    "Media Sosial dan Komunikasi",
    "Profil Pelajar Pancasila",
    "Anti Narkoba",
    "Anti Plagiarisme",
    "Anti Plagarisme",
    "Fun Pos",
    "Ingat Aku - Posisi",
    "Ingat Aku - Tulisan",
  ];
  for (const cat of officialCategories) {
    await db.delete(questions).where(eq(questions.category, cat));
  }

  const rawQuestionsData = [
    // --- POS 1: Anti Korupsi dan Terorisme (8 Soal Pilihan Ganda) ---
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Panitia sebuah festival mahasiswa mendapatkan dana kegiatan sebesar Rp25 juta dari kampus dan sponsor. Setelah acara selesai, bendahara menemukan bahwa terdapat sisa dana Rp2 juta. Ketua panitia mengusulkan agar uang tersebut dibagi kepada pengurus inti sebagai “bonus karena sudah bekerja keras”. Ia berpendapat bahwa tidak ada pihak yang akan dirugikan karena seluruh rangkaian acara sudah selesai.\n\nJika kamu menjadi anggota panitia, respons yang paling tepat adalah ...",
      options: [
        "A. Menyetujui karena uang tersebut merupakan hasil kerja keras panitia",
        "B. Membagi uang hanya kepada panitia yang memiliki tanggung jawab paling besar",
        "C. Menggunakan uang tersebut untuk acara makan bersama agar tidak perlu dimasukkan ke laporan",
        "D. Memastikan penggunaan sisa dana mengikuti ketentuan anggaran dan mempertanggungjawabkannya secara transparan",
        "E. Membiarkan ketua mengambil keputusan karena ia memiliki tanggung jawab terbesar",
      ],
      correctAnswer: "D. Memastikan penggunaan sisa dana mengikuti ketentuan anggaran dan mempertanggungjawabkannya secara transparan",
      explanation: "JAWABAN : D (Pilar 1, Pilar 4)",
      baseScore: 13,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Sebuah diskusi mahasiswa mengenai konflik sosial berlangsung di kampus. Salah satu peserta menyampaikan pendapat yang sangat keras dan menyebut kelompok tertentu sebagai “ancaman bagi masyarakat”. Beberapa peserta kemudian mulai menganggap kekerasan terhadap kelompok tersebut sebagai sesuatu yang dapat dibenarkan.\n\nSebagai mahasiswa yang berada dalam forum tersebut, tindakan yang paling tepat adalah ...",
      options: [
        "A. Membiarkan diskusi berlangsung karena setiap orang memiliki kebebasan berpendapat",
        "B. Mengkritisi narasi yang membenarkan kekerasan, mengarahkan diskusi pada fakta dan dialog yang konstruktif",
        "C. Menghentikan seluruh diskusi mengenai konflik sosial agar tidak menimbulkan masalah",
        "D. Membalas pernyataan tersebut dengan menyudutkan kelompok yang berbeda",
        "E. Mengunggah rekaman diskusi ke media sosial agar masyarakat dapat memberikan penilaian",
      ],
      correctAnswer: "B. Mengkritisi narasi yang membenarkan kekerasan, mengarahkan diskusi pada fakta dan dialog yang konstruktif",
      explanation: "JAWABAN : B (Pilar 1, Pilar 4)",
      baseScore: 12,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Seorang mahasiswa menjadi panitia seleksi peserta untuk mengikuti program pertukaran mahasiswa. Sehari sebelum seleksi, salah satu peserta memberikan kepadanya hadiah dengan mengatakan, “Ini cuma tanda terima kasih, tidak ada hubungannya dengan seleksi.”\nMahasiswa tersebut kemudian merasa tidak enak jika harus memberikan penilaian yang rendah kepada peserta tersebut.\n\nSituasi tersebut menunjukkan bahwa pemberian hadiah dapat menjadi masalah karena ...",
      options: [
        "A. Semua hadiah kepada mahasiswa merupakan bentuk korupsi",
        "B. Hadiah tersebut dapat menimbulkan rasa sungkan dan memengaruhi objektivitas dalam pengambilan keputusan",
        "C. Peserta tidak boleh memberikan hadiah kepada siapa pun",
        "D. Panitia seleksi tidak boleh berinteraksi dengan peserta",
        "E. Hadiah hanya boleh diberikan setelah pengumuman hasil seleksi",
      ],
      correctAnswer: "B. Hadiah tersebut dapat menimbulkan rasa sungkan dan memengaruhi objektivitas dalam pengambilan keputusan",
      explanation: "JAWABAN : B (Pilar 1, Pilar 4)",
      baseScore: 13,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Sebuah unggahan tentang konflik sosial menjadi viral di kalangan mahasiswa. Banyak komentar berisi informasi yang belum terverifikasi dan beberapa di antaranya mengajak pengguna untuk melakukan tindakan kekerasan. Seorang mahasiswa kemudian ingin membagikan unggahan tersebut karena menurutnya semakin banyak orang yang melihat, semakin cepat masalah tersebut diketahui.\n\nApa yang seharusnya menjadi pertimbangan utama sebelum mahasiswa tersebut membagikannya?",
      options: [
        "A. Memeriksa popularitas unggahan dan melihat respons pengguna terhadap informasi tersebut.",
        "B. Memeriksa kesesuaian isi unggahan dengan pandangan pribadi terhadap konflik tersebut.",
        "C. Memeriksa kebenaran informasi dan mempertimbangkan dampak dari penyebarannya.",
        "D. Memeriksa banyaknya akun yang membagikan dan mendukung informasi tersebut.",
        "E. Memeriksa kredibilitas akun dan sumber yang digunakan dalam unggahan tersebut.",
      ],
      correctAnswer: "C. Memeriksa kebenaran informasi dan mempertimbangkan dampak dari penyebarannya.",
      explanation: "JAWABAN : C (Pilar 1, Pilar 4)",
      baseScore: 12,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Seorang mahasiswa menemukan bukti bahwa sebagian dana kegiatan organisasi digunakan untuk kepentingan pribadi salah satu pengurus. Ia ingin melaporkan hal tersebut, tetapi beberapa temannya memperingatkan bahwa tindakan tersebut dapat membuatnya dikucilkan karena pengurus yang terlibat cukup berpengaruh.\n\nSikap yang paling tepat adalah ...",
      options: [
        "A. Mengabaikannya agar hubungan pertemanan tetap baik",
        "B. Menyebarkan bukti tersebut ke media sosial tanpa melakukan klarifikasi",
        "C. Menghilangkan bukti agar masalah tidak semakin besar",
        "D. Menggunakan mekanisme pelaporan dan menyampaikan informasi secara bertanggung jawab",
        "E. Menghadapi pengurus tersebut secara langsung dan mengancam akan membongkar",
      ],
      correctAnswer: "D. Menggunakan mekanisme pelaporan dan menyampaikan informasi secara bertanggung jawab",
      explanation: "JAWABAN : D (Pilar 1, Pilar 4)",
      baseScore: 13,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Seorang mahasiswa mendapat tugas membuat laporan penelitian kelompok. Saat mengumpulkan data, hasil yang diperoleh ternyata berbeda dengan penelitian terdahulu. Salah satu anggota kelompok mengusulkan untuk menyesuaikan beberapa data agar hasil penelitian terlihat lebih sesuai dengan teori yang digunakan.\n\nApa tindakan yang paling tepat dilakukan kelompok tersebut?",
      options: [
        "A. Menyesuaikan data agar hasil penelitian lebih mudah diterima",
        "B. Menggunakan data yang sesuai dengan teori dan mengabaikan sisanya",
        "C. Menyajikan data sesuai hasil penelitian dan membahas perbedaannya",
        "D. Mengubah sebagian data selama kesimpulannya tidak berubah",
        "E. Mengikuti hasil penelitian terdahulu agar laporan lebih meyakinkan",
      ],
      correctAnswer: "C. Menyajikan data sesuai hasil penelitian dan membahas perbedaannya",
      explanation: "JAWABAN: C (Pilar 1, Pilar 4)",
      baseScore: 12,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Ketua sebuah organisasi mahasiswa memiliki akses terhadap fasilitas kampus untuk mendukung kegiatan organisasi. Suatu hari, ia menggunakan fasilitas tersebut untuk membantu kegiatan pribadi temannya di luar program organisasi. Ketika ditanya oleh anggota lain, ia mengatakan bahwa fasilitas tersebut juga digunakan mahasiswa sehingga tidak menjadi masalah.\n\nApa yang menjadi permasalahan utama dalam kasus tersebut?",
      options: [
        "A. Penggunaan fasilitas untuk kegiatan mahasiswa di luar organisasi",
        "B. Penggunaan fasilitas berdasarkan hubungan pribadi dengan mahasiswa lain",
        "C. Pemanfaatan wewenang organisasi untuk kepentingan di luar tanggung jawabnya",
        "D. Kurangnya koordinasi antara ketua dengan anggota organisasi",
        "E. Ketidaksesuaian penggunaan fasilitas dengan kegiatan mahasiswa",
      ],
      correctAnswer: "C. Pemanfaatan wewenang organisasi untuk kepentingan di luar tanggung jawabnya",
      explanation: "JAWABAN: C (Pilar 1, Pilar 4)",
      baseScore: 13,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Dalam sebuah organisasi mahasiswa, pengurus inti memutuskan penggunaan dana untuk membeli perlengkapan kegiatan. Keputusan tersebut dibuat tanpa melibatkan anggota lain karena dianggap lebih cepat. Setelah pembelian dilakukan, beberapa anggota mempertanyakan harga barang yang ternyata lebih tinggi dari perkiraan awal.\n\nLangkah yang paling tepat untuk mencegah masalah serupa adalah ...",
      options: [
        "A. Membatasi pengambilan keputusan hanya pada pengurus inti",
        "B. Membuat proses pengambilan keputusan dan penggunaan dana lebih terbuka",
        "C. Mengutamakan keputusan yang paling cepat untuk setiap kegiatan",
        "D. Menyerahkan seluruh keputusan kepada bendahara organisasi",
        "E. Menghindari pembelian barang dengan harga yang tinggi",
      ],
      correctAnswer: "B. Membuat proses pengambilan keputusan dan penggunaan dana lebih terbuka",
      explanation: "JAWABAN: B (Pilar 1, Pilar 4)",
      baseScore: 12,
      tags: ["pos:1", "lantai:1", "pilar:1", "pilar:4"],
    },

    // --- POS 2: Leadership (5 Pasang Kartu Memory Match) ---
    {
      category: "Leadership",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Integritas",
      options: ["Integritas", "Jujur dan konsisten antara perkataan dan perbuatan"],
      correctAnswer: "Jujur dan konsisten antara perkataan dan perbuatan",
      explanation: "Karakter Dasar: Integritas <-> Jujur dan konsisten antara perkataan dan perbuatan",
      baseScore: 15,
      tags: ["pos:2", "lantai:2", "pilar:2", "type:memory"],
    },
    {
      category: "Leadership",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Delegasi",
      options: ["Delegasi", "Breakdown tugas menjadi bagian-bagian kecil & bagi peran sesuai keahlian"],
      correctAnswer: "Breakdown tugas menjadi bagian-bagian kecil & bagi peran sesuai keahlian",
      explanation: "Manajemen Tugas: Delegasi <-> Breakdown tugas menjadi bagian-bagian kecil & bagi peran sesuai keahlian",
      baseScore: 20,
      tags: ["pos:2", "lantai:2", "pilar:2", "type:memory"],
    },
    {
      category: "Leadership",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Ada anggota kelompok yang sukanya cuma \"numpang nama\" tapi ilang-ilangan",
      options: [
        "Ada anggota kelompok yang sukanya cuma \"numpang nama\" tapi ilang-ilangan",
        "Kasih deadline & tenggat tegas, kalau tetep ghosting baru lapor dosen.",
      ],
      correctAnswer: "Kasih deadline & tenggat tegas, kalau tetep ghosting baru lapor dosen.",
      explanation: "Penanganan Anggota: Ada anggota kelompok yang sukanya cuma \"numpang nama\" tapi ilang-ilangan <-> Kasih deadline & tenggat tegas, kalau tetep ghosting baru lapor dosen.",
      baseScore: 25,
      tags: ["pos:2", "lantai:2", "pilar:2", "type:memory"],
    },
    {
      category: "Leadership",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Visioner",
      options: ["Visioner", "Punya Pandangan Jauh Kedepan Untuk Organisasi"],
      correctAnswer: "Punya Pandangan Jauh Kedepan Untuk Organisasi",
      explanation: "Perencanaan: Visioner <-> Punya Pandangan Jauh Kedepan Untuk Organisasi",
      baseScore: 15,
      tags: ["pos:2", "lantai:2", "pilar:2", "type:memory"],
    },
    {
      category: "Leadership",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Problem Solving",
      options: [
        "Problem Solving",
        "Rundown acara mendadak berantakan karena mati listrik di tengah-tengah acara.Tetap tenang, alihkan ke sesi ice breaking manual sambil tim teknis backup",
      ],
      correctAnswer: "Rundown acara mendadak berantakan karena mati listrik di tengah-tengah acara.Tetap tenang, alihkan ke sesi ice breaking manual sambil tim teknis backup",
      explanation: "Pengambilan Keputusan: Problem Solving <-> Rundown acara mendadak berantakan karena mati listrik di tengah-tengah acara.Tetap tenang, alihkan ke sesi ice breaking manual sambil tim teknis backup",
      baseScore: 25,
      tags: ["pos:2", "lantai:2", "pilar:2", "type:memory"],
    },

    // --- POS 3: Profil Pelajar Pancasila (5 Soal Benar / Salah) ---
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "EASY" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Menolak kerja kelompok karena merasa mampu mengerjakan semuanya sendiri menunjukkan sikap mandiri.",
      options: ["Benar", "Salah"],
      correctAnswer: "Salah",
      explanation: "Jawaban: Salah (Pilar 1)",
      baseScore: 15,
      tags: ["pos:3", "lantai:3", "pilar:1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "MEDIUM" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Mengikuti budaya asing tanpa mempertimbangkan kesesuaiannya dengan nilai yang diyakini merupakan bentuk berkebhinnekaan global.",
      options: ["Benar", "Salah"],
      correctAnswer: "Salah",
      explanation: "Jawaban: Salah (Pilar 1)",
      baseScore: 20,
      tags: ["pos:3", "lantai:3", "pilar:1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "MEDIUM" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Menjalankan ibadah dengan baik tetapi merendahkan pemeluk agama lain bertentangan dengan karakter berakhlak mulia.",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      explanation: "Jawaban: Benar (Pilar 1)",
      baseScore: 20,
      tags: ["pos:3", "lantai:3", "pilar:1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "MEDIUM" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Menerima kritik tanpa mengevaluasi kebenarannya bukan merupakan bentuk berpikir kritis.",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      explanation: "Jawaban: Benar (Pilar 1)",
      baseScore: 20,
      tags: ["pos:3", "lantai:3", "pilar:1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "HARD" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Kelompok yang membagi tugas secara adil tetapi menggunakan cara lama tanpa mencoba memperbaikinya sudah menunjukkan gotong royong, tetapi belum tentu menunjukkan kreativitas.",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      explanation: "Jawaban benar (Pilar 1)",
      baseScore: 25,
      tags: ["pos:3", "lantai:3", "pilar:1"],
    },

    // --- POS 4: Anti Narkoba (5 Clue TTS) ---
    {
      category: "Anti Narkoba",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENDATAR Zat yang dapat menyebabkan ketergantungan dan merusak sistem saraf?",
      options: ["NARKOBA"],
      correctAnswer: "NARKOBA",
      explanation: "jawaban: NARKOBA (Pilar 4)",
      baseScore: 20,
      tags: ["pos:4", "lantai:4", "pilar:4", "type:tts"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENDATAR Kondisi tubuh yang bergantung terus-menerus pada suatu zat.",
      options: ["KETAGIHAN"],
      correctAnswer: "KETAGIHAN",
      explanation: "Jawaban: KETAGIHAN (Pilar 4)",
      baseScore: 20,
      tags: ["pos:4", "lantai:4", "pilar:4", "type:tts"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENURUN. Lawan kata \"kecanduan\", kondisi bebas dari pengaruh zat terlarang.",
      options: ["BEBAS"],
      correctAnswer: "BEBAS",
      explanation: "jawaban: BEBAS (Pilar 4)",
      baseScore: 20,
      tags: ["pos:4", "lantai:4", "pilar:4", "type:tts"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENDATAR. Tempat rehabilitasi bagi pengguna narkoba biasa disebut panti?",
      options: ["REHAB"],
      correctAnswer: "REHAB",
      explanation: "Jawaban: REHAB (Pilar 4)",
      baseScore: 20,
      tags: ["pos:4", "lantai:4", "pilar:4", "type:tts"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENURUN. Sikap menolak dengan tegas terhadap penyalahgunaan narkoba?.",
      options: ["TOLAK"],
      correctAnswer: "TOLAK",
      explanation: "Jawaban: TOLAK (Pilar 4)",
      baseScore: 20,
      tags: ["pos:4", "lantai:4", "pilar:4", "type:tts"],
    },

    // --- POS 5: Anti Plagiarisme (5 Riddle Tebak Kata) ---
    {
      category: "Anti Plagiarisme",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah tindakan mengambil ide, kalimat, atau karya orang lain lalu mengakuinya sebagai hasil karyamu sendiri tanpa izin atau tanpa menyebut sumbernya. Aku adalah musuh utama dunia akademik. Siapakah aku?",
      options: ["PLAGIAT"],
      correctAnswer: "PLAGIAT",
      explanation: "Jawaban: PLAGIAT (Pilar 4)",
      baseScore: 10,
      tags: ["pos:5", "lantai:5", "pilar:4", "type:tebak_kata"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah bagian kalimat atau paragraf yang kamu ambil persis dari sumber lain, biasanya ditulis di antara tanda petik (\"...\"), dan wajib disebutkan sumbernya. Tanpa aku disebutkan asalnya, kamu bisa dianggap plagiat. Siapakah aku?",
      options: ["KUTIPAN"],
      correctAnswer: "KUTIPAN",
      explanation: "Jawaban: KUTIPAN (Pilar 4)",
      baseScore: 20,
      tags: ["pos:5", "lantai:5", "pilar:4", "type:tebak_kata"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah daftar sumber (buku, jurnal, artikel, atau website) yang kamu gunakan saat menulis tugas atau skripsi. Aku biasanya muncul di halaman paling akhir sebuah karya tulis. Tanpa aku, pembaca tidak tahu dari mana ide-ide dalam tulisanmu berasal. Siapakah aku?",
      options: ["REFERENSI"],
      correctAnswer: "REFERENSI",
      explanation: "Jawaban: REFERENSI (Pilar 4)",
      baseScore: 20,
      tags: ["pos:5", "lantai:5", "pilar:4", "type:tebak_kata"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah nilai kejujuran dalam belajar dan berkarya — tidak menyontek, tidak memalsukan data, dan tidak mengaku karya orang lain sebagai milikmu. Kampus sangat menjunjung tinggi diriku. Siapakah aku?",
      options: ["INTEGRITAS AKADEMIK"],
      correctAnswer: "INTEGRITAS AKADEMIK",
      explanation: "Jawaban: INTEGRITAS AKADEMIK (Pilar 4)",
      baseScore: 25,
      tags: ["pos:5", "lantai:5", "pilar:4", "type:tebak_kata"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku mirip plagiat, tapi bedanya: yang \"dicuri\" adalah karyamu sendiri! Aku terjadi ketika seseorang mengirim ulang atau menerbitkan kembali tulisannya yang lama tanpa memberi keterangan bahwa itu bukan karya baru. Siapakah aku?",
      options: ["AUTOPLAGIARISME"],
      correctAnswer: "AUTOPLAGIARISME",
      explanation: "Jawaban: AUTOPLAGIARISME (Pilar 4)",
      baseScore: 25,
      tags: ["pos:5", "lantai:5", "pilar:4", "type:tebak_kata"],
    },

    // --- POS 6: Media Sosial dan Komunikasi (8 Soal Jawaban Singkat / Pilihan) ---
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Istilah untuk perilaku tidak sopan/menyerang orang lain secara online disebut apa?",
      options: ["Cyberbulliying", "Cyber crime", "Doxing", "Flaming"],
      correctAnswer: "Cyberbulliying",
      explanation: "Jawaban: Cyberbulliying (Pilar 3,4,5)",
      baseScore: 13,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "EASY" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Semua rekam jejak aktivitas kita di internet yang tidak bisa dihapus sepenuhnya disebut?",
      options: ["Jejak Digital", "History Browser", "Cache", "Cookie"],
      correctAnswer: "Jejak Digital",
      explanation: "Jawaban: Jejak Digital (Pilar 3,4,5)",
      baseScore: 12,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Sebelum membagikan berita, langkah penting yang harus dilakukan agar tidak menyebarkan hoaks adalah?",
      options: ["Cek Fakta", "Langsung Bagikan", "Simpan Saja", "Beri Komentar"],
      correctAnswer: "Cek Fakta",
      explanation: "Jawaban: Cek Fakta (Pilar 3,4,5)",
      baseScore: 13,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "EASY" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Istilah untuk aturan/tata krama berkomunikasi di dunia maya disebut?",
      options: ["Netiket", "Netizen", "Protokol", "Cyberlaw"],
      correctAnswer: "Netiket",
      explanation: "Jawaban: Netiket (Pilar 3,4,5)",
      baseScore: 12,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Dalam komunikasi, pesan yang disampaikan harus jelas, singkat, dan tidak bertele-tele ini disebut prinsip?",
      options: ["Konkret", "Abstrak", "Subjektif", "Implisit"],
      correctAnswer: "Konkret",
      explanation: "Jawaban: Konkret (Pilar 3,4,5)",
      baseScore: 13,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "EASY" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Fitur di media sosial yang membatasi siapa saja yang bisa melihat postingan kita disebut?",
      options: ["Pengaturan Privasi", "Blokir Akun", "Arsip Postingan", "Filter Konten"],
      correctAnswer: "Pengaturan Privasi",
      explanation: "Jawaban: Pengaturan Privasi (Pilar 3,4,5)",
      baseScore: 12,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Upaya membangun citra diri yang positif dan konsisten di media sosial disebut?",
      options: ["Personal Branding", "Pencitraan Palsu", "Promosi Diri", "Portofolio"],
      correctAnswer: "Personal Branding",
      explanation: "Jawaban: Personal Branding (Pilar 3,4,5)",
      baseScore: 13,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },
    {
      category: "Media Sosial dan Komunikasi",
      difficulty: "EASY" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Saat organisasi terkena isu negatif di media sosial, langkah resmi untuk meluruskan informasi disebut?",
      options: ["Klarifikasi", "Somasi", "Bantahan", "Investigasi"],
      correctAnswer: "Klarifikasi",
      explanation: "Jawaban: Klarifikasi (Pilar 3,4,5)",
      baseScore: 12,
      tags: ["pos:6", "lantai:2", "pilar:3", "pilar:4", "pilar:5"],
    },

    // --- POS 7: Menebak Gambar siapa atau suara dari gambar tersebut (Fun Pos) ---
    {
      category: "Fun Pos",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal: Lagu apa yang cocok untukku? dan siapakah aku?",
      options: ["MBG, Mas Bahlil Ganteng", "Syubbanul Wathan", "Indonesia Raya", "Mars UNU"],
      correctAnswer: "MBG, Mas Bahlil Ganteng",
      explanation: "Jawab: MBG, Mas Bahlil Ganteng",
      baseScore: 20,
      tags: ["pos:7", "lantai:6", "gdrive:1gSO19MNNdMX5qpbn7At81Fp8ZNKmjiBu"],
    },
    {
      category: "Fun Pos",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal: Hari ini di jogja saya akan lawan, Siapakah diriku? dan mana asalku?",
      options: ["Jokowi Pria Solo", "Gibran Solo", "Prabowo Jakarta", "Sultan Jogja"],
      correctAnswer: "Jokowi Pria Solo",
      explanation: "Jawab: Jokowi Pria Solo",
      baseScore: 20,
      tags: ["pos:7", "lantai:6", "gdrive:1Ov580yOxG6Wt3350XnQcHFaeC8JdSo2m"],
    },
    {
      category: "Fun Pos",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal: Siapa tokoh bersejarah ini? Dan apa kalimat motivasi nya?",
      options: ["Prabowo, Saatnya untuk nyawit", "Soekarno, Jasmerah", "Hatta, Koperasi", "Gus Dur, Gitu aja kok repot"],
      correctAnswer: "Prabowo, Saatnya untuk nyawit",
      explanation: "Jawab: Prabowo, Saatnya untuk nyawit",
      baseScore: 20,
      tags: ["pos:7", "lantai:6", "gdrive:1rPBsyOTf8FBT1IYOj0TZCvzIb6GWB1F9"],
    },
    {
      category: "Fun Pos",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal: Aku adalah saudaramu, siapakah aku?",
      options: ["monyet", "kucing", "harimau", "orangutan"],
      correctAnswer: "monyet",
      explanation: "Jawab: monyet",
      baseScore: 20,
      tags: ["pos:7", "lantai:6", "gdrive:1a6p4BbTwVNhLoulpsjlf7w7e6Hi6vm59"],
    },
    {
      category: "Fun Pos",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal: Suaraku merdu seperti Ajeng Febri, siapakah aku? Dan bagaimana suaraku?",
      options: ["Sapi, mohhh", "Kambing, mbeeek", "Kucing, meow", "Bebek, kwek"],
      correctAnswer: "Sapi, mohhh",
      explanation: "Jawab: Sapi, mohhh",
      baseScore: 20,
      tags: ["pos:7", "lantai:6", "gdrive:1K_JfdcvOdBC-rmtSmCUdyzH_OMzgE7xH"],
    },

    // --- POS 8: Ingat Aku (Tebak Posisi) Gambar ada di sebelah mana atau lantai berapa ---
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Pertanyaan (Foto 1) : Ada di lantai berapakah aku?",
      options: ["Lantai 1", "Lantai 2 amphiteater", "Lantai 3", "Lantai 4"],
      correctAnswer: "Lantai 2 amphiteater",
      explanation: "jawaban Lantai 2 amphiteater",
      baseScore: 20,
      tags: ["pos:8", "lantai:6", "gdrive:1Yyxf7m4tb83xOGe0IH4q72t4lSQsG2yW"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Pertanyaan (Foto 2) : Ada dilantai berapakah aku?",
      options: ["Lantai 2", "Lantai 3", "Lantai 4", "Lantai 5"],
      correctAnswer: "Lantai 4",
      explanation: "jawaban Lantai 4",
      baseScore: 20,
      tags: ["pos:8", "lantai:6", "gdrive:1alaoLPnHhU-nbpyGPt2UtsV0O9s7P26E"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Pertanyaan (Foto 3) : Ada di lantai berapakah aku?",
      options: ["Lantai 1", "Lantai 2", "Lantai 3", "Lantai 4"],
      correctAnswer: "Lantai 1",
      explanation: "jawaban Lantai  1",
      baseScore: 20,
      tags: ["pos:8", "lantai:6", "gdrive:1AeC5fxt5jaWec-QrNY0XItnka6K3HW-Q"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Pertanyaan (Foto 4) : Ada di lantai berapakah aku?",
      options: ["Lantai 2", "Lantai 3", "Lantai 4", "Lantai 5"],
      correctAnswer: "Lantai 4",
      explanation: "jawaban Lantai 4",
      baseScore: 20,
      tags: ["pos:8", "lantai:6", "gdrive:1Ksd55wXqi0DsP7hzjZMmJToKdiFwOSuU"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Pertanyaan (Foto 5) : Ada di lantai berapakah aku?",
      options: ["Lantai 1", "Lantai 2", "Lantai 3", "Lantai 4"],
      correctAnswer: "Lantai 3",
      explanation: "jawaban Lantai 3",
      baseScore: 20,
      tags: ["pos:8", "lantai:6", "gdrive:1wRZ-7UQjUqCKdsBCd8mgN3aIgnEyyHLb"],
    },

    // --- POS 9: Ingat Aku (Tebak Tulisan) Teks Gambar di Blur ---
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal (Gambar 1): Tulisan apakah ini?",
      options: ["Internet Center", "Creative Corner", "Your Bright Future Starts Here", "Build Ur Own Startup"],
      correctAnswer: "Internet Center",
      explanation: "Jawab: Internet Center",
      baseScore: 20,
      tags: ["pos:9", "lantai:4", "gdrive:1S0ZOeETjD1l9xPpoE6KnvIC-_L32vlzL"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal (Gambar 2): Tulisan apakah ini?",
      options: ["Creative Corner", "Internet Center", "Your Bright Future Starts Here", "Build Ur Own Startup"],
      correctAnswer: "Creative Corner",
      explanation: "Jawab: Creative Corner",
      baseScore: 20,
      tags: ["pos:9", "lantai:4", "gdrive:1yJ9kD3DW9WMNNOaea8RKCVixVGANmQEO"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal (Gambar 3): Tulisan apakah ini?",
      options: ["Your Bright Future Starts Here", "Internet Center", "Creative Corner", "Build Ur Own Startup"],
      correctAnswer: "Your Bright Future Starts Here",
      explanation: "Jawab: Your Bright Future Starts Here",
      baseScore: 20,
      tags: ["pos:9", "lantai:4", "gdrive:1J1v_rdHQm7aw_YDemSLYiuJMAaecED4P"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal (Gambar 4): Tulisan apakah ini?",
      options: ["Build Ur Own Startup", "Internet Center", "Creative Corner", "Your Bright Future Starts Here"],
      correctAnswer: "Build Ur Own Startup",
      explanation: "Jawab: Build Ur Own Startup",
      baseScore: 20,
      tags: ["pos:9", "lantai:4", "gdrive:1QDVanLV67fUH8cRn769xUdYPo7ce17bY"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "HARD" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Soal (Gambar 5): Siapa nama 3 tokoh ini? Harus urut!",
      options: [
        "1. KH. M Hasyim Asyaari, 2. KH. Bisri Syansuri, 3. KH. Abdul Wahab Chasbullah",
        "1. KH. Abdul Wahab Chasbullah, 2. KH. Bisri Syansuri, 3. KH. M Hasyim Asyaari",
        "1. KH. Bisri Syansuri, 2. KH. M Hasyim Asyaari, 3. KH. Abdul Wahab Chasbullah",
        "1. KH. M Hasyim Asyaari, 2. KH. Abdul Wahab Chasbullah, 3. KH. Bisri Syansuri",
      ],
      correctAnswer: "1. KH. M Hasyim Asyaari, 2. KH. Bisri Syansuri, 3. KH. Abdul Wahab Chasbullah",
      explanation: "Jawab: 1. KH. M Hasyim Asyaari\n2. KH. Bisri Syansuri\n3. KH. Abdul Wahab Chasbullah",
      baseScore: 20,
      tags: ["pos:9", "lantai:4", "gdrive:1Q3Cht2fn4Sn9VxArIEnXH8e3HGwI7t9y"],
    },
  ];

  let insertedCount = 0;
  let updatedCount = 0;

  for (const q of rawQuestionsData) {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionText, q.questionText))
      .limit(1);

    if (!existing) {
      await db.insert(questions).values({
        category: q.category,
        difficulty: q.difficulty,
        type: q.type as any,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        baseScore: q.baseScore,
        tags: q.tags,
        status: "ACTIVE",
      });
      insertedCount++;
    } else {
      await db
        .update(questions)
        .set({
          category: q.category,
          difficulty: q.difficulty,
          type: q.type as any,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          baseScore: q.baseScore,
          tags: q.tags,
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(eq(questions.id, existing.id));
      updatedCount++;
    }
  }

  console.log(`   ✅ Bank Soal selesai: ${insertedCount} baru ditambahkan, ${updatedCount} diperbarui.`);
  console.log("🎉 [SEEDER] Seluruh data kuis resmi 9 Pos berhasil disinkronkan ke database PostgreSQL!");
}

if (import.meta.main) {
  try {
    await seedOfficialQuizDatabase();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Seeding gagal:", err);
    process.exit(1);
  }
}
