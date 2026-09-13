import { db } from "../src/db";
import { floors, locations, games, questions, missions, stages } from "../src/db/schema";
import { eq, inArray, and } from "drizzle-orm";

async function main() {
  console.log("🚀 Seeding Official GENIUS 2026 Quiz & Gamification Database...");

  // 1. SEED 6 FLOORS
  const officialFloors = [
    { number: 1, name: "Lantai 1 - Welcome Hall & Karakter Kampus", description: "Lobby utama, pengenalan karakter integritas, anti-korupsi & pencegahan radikalisme." },
    { number: 2, name: "Lantai 2 - Leadership & Media Komunikasi", description: "Pengembangan kepemimpinan inklusif, pemecahan masalah, dan etika komunikasi digital." },
    { number: 3, name: "Lantai 3 - Profil Pelajar Pancasila", description: "Internalisasi 6 dimensi profil pelajar Pancasila dan penalaran kritis mahasiswa." },
    { number: 4, name: "Lantai 4 - Ketahanan Diri & Observasi Kampus", description: "Kampus sehat bebas narkoba (TTS) dan observasi ruang kolaborasi inovatif." },
    { number: 5, name: "Lantai 5 - Integritas Akademik & Anti Plagiarisme", description: "Standar orisinalitas riset ilmiah, sitasi, dan etika penulisan karya akademik." },
    { number: 6, name: "Lantai 6 - Fun Pos & Orientasi Fasilitas Kampus", description: "Pengenalan fasilitas kampus UNU, spot amphiteater, dan fun challenges." },
  ];

  console.log("  🏢 Upserting 6 Floors...");
  for (const f of officialFloors) {
    const [existing] = await db.select().from(floors).where(eq(floors.number, f.number)).limit(1);
    if (!existing) {
      await db.insert(floors).values({
        number: f.number,
        name: f.name,
        description: f.description,
      });
    } else {
      await db.update(floors).set({ name: f.name, description: f.description }).where(eq(floors.number, f.number));
    }
  }

  // Retrieve floors map
  const allFloors: Array<{ id: string; number: number }> = await db.select().from(floors);
  const floorMap = new Map(allFloors.map((f: { id: string; number: number }) => [f.number, f.id]));

  // 2. SEED 9 LOCATIONS / POS
  const officialLocations = [
    { code: "POS-L1-1", name: "Pos 1: Anti Korupsi & Terorisme", floorNum: 1, desc: "Pilihan Ganda Studi Kasus Integritas & Anti Terorisme", qr: "GENIUS-QR-POS-1" },
    { code: "POS-L2-2", name: "Pos 2: Leadership & Problem Solving", floorNum: 2, desc: "Memory Match Pasangan Kartu Konsep & Aksi Kepemimpinan", qr: "GENIUS-QR-POS-2" },
    { code: "POS-L2-6", name: "Pos 6: Media Sosial & Komunikasi", floorNum: 2, desc: "Tantangan Jawaban Singkat Etika Digital & Komunikasi Kampus", qr: "GENIUS-QR-POS-6" },
    { code: "POS-L3-3", name: "Pos 3: Profil Pelajar Pancasila", floorNum: 3, desc: "Evaluasi Pernyataan Benar/Salah Nilai Luhur Pancasila", qr: "GENIUS-QR-POS-3" },
    { code: "POS-L4-4", name: "Pos 4: Kampus Bersinar Anti Narkoba", floorNum: 4, desc: "Teka-Teki Silang (TTS) Khazanah Hidup Sehat Tanpa Narkoba", qr: "GENIUS-QR-POS-4" },
    { code: "POS-L4-9", name: "Pos 9: Ingat Aku - Teks Blur & Tokoh NU", floorNum: 4, desc: "Tebak Teks Gambar Blur Fasilitas Kampus & Urutan 3 Tokoh Pendiri NU", qr: "GENIUS-QR-POS-9" },
    { code: "POS-L5-5", name: "Pos 5: Integritas Akademik & Anti Plagiat", floorNum: 5, desc: "Tebak Kata Sandi Riddle 'Siapakah Aku?' Dunia Akademik", qr: "GENIUS-QR-POS-5" },
    { code: "POS-L6-7", name: "Pos 7: Fun Pos Gambar & Kreativitas", floorNum: 6, desc: "Tebak Gambar & Tantangan Kreatif Tim", qr: "GENIUS-QR-POS-7" },
    { code: "POS-L6-8", name: "Pos 8: Ingat Aku - Tebak Posisi Lantai Gedung", floorNum: 6, desc: "Tebak Lokasi Lantai Kampus Berdasarkan Foto Sudut Gedung", qr: "GENIUS-QR-POS-8" },
  ];

  console.log("  📍 Upserting 9 Pos Locations...");
  for (const loc of officialLocations) {
    const floorId = floorMap.get(loc.floorNum);
    if (!floorId) continue;
    const [existing] = await db.select().from(locations).where(eq(locations.code, loc.code)).limit(1);
    if (!existing) {
      await db.insert(locations).values({
        code: loc.code,
        name: loc.name,
        description: loc.desc,
        floorId,
        qrCode: loc.qr,
        capacity: 10,
        status: "AVAILABLE",
      });
    } else {
      await db.update(locations).set({
        name: loc.name,
        description: loc.desc,
        floorId,
        qrCode: loc.qr,
      }).where(eq(locations.code, loc.code));
    }
  }

  // 3. SEED 9 GAMES DEFINITION
  const officialGames = [
    {
      name: "Pos 1 — Studi Kasus Integritas & Anti Korupsi",
      type: "QUIZ" as const,
      description: "Tantangan 8 studi kasus pilihan ganda menguji integritas pengelolaan dana, whistleblowing, dan pencegahan intoleransi.",
      instructions: "Pilih tindakan paling tepat untuk setiap dilema etika kampus sebelum waktu habis.",
      config: {
        totalQuestions: 8,
        timeLimitSeconds: 120,
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
        timeLimitSeconds: 90,
        maxScore: 100,
      },
      questionBankCategory: "Media Sosial dan Komunikasi",
    },
    {
      name: "Pos 7 — Fun Pos Tebak Gambar Kreatif",
      type: "IMAGE_GUESS" as const,
      description: "Tantangan tebak visual gambar dan kreativitas pengamatan mahasiswa baru.",
      instructions: "Amati petunjuk visual yang terbuka dan tebak objek atau makna di baliknya!",
      config: {
        totalQuestions: 5,
        timeLimitSeconds: 60,
        maxScore: 100,
      },
      questionBankCategory: "Fun Pos",
    },
    {
      name: "Pos 8 — Ingat Aku: Tebak Lokasi Lantai Gedung",
      type: "LOGIC" as const,
      description: "Tebak lokasi lantai berdasarkan 5 foto sudut fasilitas kampus UNU (Amphiteater, rooftop, selasar, student center).",
      instructions: "Perhatikan foto lokasi yang disajikan, lalu pilih di lantai berapakah ruangan tersebut berada!",
      config: {
        totalQuestions: 5,
        timeLimitSeconds: 60,
        maxScore: 100,
        scorePerQuestion: 20,
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
      },
      questionBankCategory: "Ingat Aku - Tulisan",
    },
  ];

  console.log("  🎮 Upserting 9 Official Games...");
  for (const g of officialGames) {
    const [existing] = await db.select().from(games).where(eq(games.name, g.name)).limit(1);
    if (!existing) {
      await db.insert(games).values({
        name: g.name,
        type: g.type,
        description: g.description,
        instructions: g.instructions,
        config: g.config,
        questionBankCategory: g.questionBankCategory,
        minPlayers: 1,
        maxPlayers: 10,
        status: "ACTIVE",
      });
    } else {
      await db.update(games).set({
        type: g.type,
        description: g.description,
        instructions: g.instructions,
        config: g.config,
        questionBankCategory: g.questionBankCategory,
        status: "ACTIVE",
      }).where(eq(games.name, g.name));
    }
  }

  // 4. SEED QUESTIONS REPOSITORY
  console.log("  ❓ Seeding Master Questions for all Pos...");

  const allQuestions = [
    // POS 1: Anti Korupsi dan Terorisme (8 Soal Pilihan Ganda)
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Panitia sebuah festival mahasiswa mendapatkan dana kegiatan sebesar Rp25 juta dari kampus dan sponsor. Setelah acara selesai, bendahara menemukan bahwa terdapat sisa dana Rp2 juta. Ketua panitia mengusulkan agar uang tersebut dibagi kepada pengurus inti sebagai 'bonus karena sudah bekerja keras'. Ia berpendapat bahwa tidak ada pihak yang akan dirugikan karena seluruh rangkaian acara sudah selesai.\n\nJika kamu menjadi anggota panitia, respons yang paling tepat adalah ...",
      options: [
        "A. Menyetujui karena uang tersebut merupakan hasil kerja keras panitia",
        "B. Membagi uang hanya kepada panitia yang memiliki tanggung jawab paling besar",
        "C. Menggunakan uang tersebut untuk acara makan bersama agar tidak perlu dimasukkan ke laporan",
        "D. Memastikan penggunaan sisa dana mengikuti ketentuan anggaran dan mempertanggungjawabkannya secara transparan",
        "E. Membiarkan ketua mengambil keputusan karena ia memiliki tanggung jawab terbesar"
      ],
      correctAnswer: "D. Memastikan penggunaan sisa dana mengikuti ketentuan anggaran dan mempertanggungjawabkannya secara transparan",
      explanation: "Sisa anggaran kegiatan wajib dilaporkan secara transparan dan dikembalikan atau dialokasikan sesuai regulasi keuangan kampus, bukan dibagi-bagikan secara sepihak.",
      baseScore: 13,
      tags: ["Integritas", "Dana Kegiatan", "Pilar 1", "Pilar 4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Sebuah diskusi mahasiswa mengenai konflik sosial berlangsung di kampus. Salah satu peserta menyampaikan pendapat yang sangat keras dan menyebut kelompok tertentu sebagai 'ancaman bagi masyarakat'. Beberapa peserta kemudian mulai menganggap kekerasan terhadap kelompok tersebut sebagai sesuatu yang dapat dibenarkan.\n\nSebagai mahasiswa yang berada dalam forum tersebut, tindakan yang paling tepat adalah ...",
      options: [
        "A. Membiarkan diskusi berlangsung karena setiap orang memiliki kebebasan berpendapat",
        "B. Mengkritisi narasi yang membenarkan kekerasan, mengarahkan diskusi pada fakta dan dialog yang konstruktif",
        "C. Menghentikan seluruh diskusi mengenai konflik sosial agar tidak menimbulkan masalah",
        "D. Membalas pernyataan tersebut dengan menyudutkan kelompok yang berbeda",
        "E. Mengunggah rekaman diskusi ke media sosial agar masyarakat dapat memberikan penilaian"
      ],
      correctAnswer: "B. Mengkritisi narasi yang membenarkan kekerasan, mengarahkan diskusi pada fakta dan dialog yang konstruktif",
      explanation: "Kebebasan berpendapat dibatasi oleh hak asasi manusia; narasi yang memvalidasi kekerasan dan ekstremisme harus dikritisi dan diluruskan melalui fakta dan dialog inklusif.",
      baseScore: 12,
      tags: ["Terorisme & Intoleransi", "Pilar 1", "Pilar 4"],
    },
    {
      category: "Anti Korupsi dan Terorisme",
      difficulty: "MEDIUM" as const,
      type: "MULTIPLE_CHOICE" as const,
      questionText: "Seorang mahasiswa menjadi panitia seleksi peserta untuk mengikuti program pertukaran mahasiswa. Sehari sebelum seleksi, salah satu peserta memberikan kepadanya hadiah dengan mengatakan, 'Ini cuma tanda terima kasih, tidak ada hubungannya dengan seleksi.' Mahasiswa tersebut kemudian merasa tidak enak jika harus memberikan penilaian yang rendah kepada peserta tersebut.\n\nSituasi tersebut menunjukkan bahwa pemberian hadiah dapat menjadi masalah karena ...",
      options: [
        "A. Semua hadiah kepada mahasiswa merupakan bentuk korupsi",
        "B. Hadiah tersebut dapat menimbulkan rasa sungkan dan memengaruhi objektivitas dalam pengambilan keputusan",
        "C. Peserta tidak boleh memberikan hadiah kepada siapa pun",
        "D. Panitia seleksi tidak boleh berinteraksi dengan peserta",
        "E. Hadiah hanya boleh diberikan setelah pengumuman hasil seleksi"
      ],
      correctAnswer: "B. Hadiah tersebut dapat menimbulkan rasa sungkan dan memengaruhi objektivitas dalam pengambilan keputusan",
      explanation: "Gratifikasi dan hadiah sebelum keputusan berpotensi menciptakan konflik kepentingan (conflict of interest) dan merusak objektivitas penilai.",
      baseScore: 13,
      tags: ["Gratifikasi", "Konflik Kepentingan", "Pilar 1", "Pilar 4"],
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
        "E. Memeriksa kredibilitas akun dan sumber yang digunakan dalam unggahan tersebut."
      ],
      correctAnswer: "C. Memeriksa kebenaran informasi dan mempertimbangkan dampak dari penyebarannya.",
      explanation: "Literasi digital menuntut verifikasi faktual (saring sebelum sharing) serta analisis risiko agar tidak memicu eskalasi konflik atau radikalisme.",
      baseScore: 12,
      tags: ["Etika Media Sosial", "Pencegahan Terorisme", "Pilar 1", "Pilar 4"],
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
        "E. Menghadapi pengurus tersebut secara langsung dan mengancam akan membongkar"
      ],
      correctAnswer: "D. Menggunakan mekanisme pelaporan dan menyampaikan informasi secara bertanggung jawab",
      explanation: "Whistleblowing yang efektif harus disalurkan melalui mekanisme pengaduan resmi kampus dengan data valid, demi menjaga keadilan tanpa aksi main hakim sendiri.",
      baseScore: 13,
      tags: ["Whistleblowing", "Anti Korupsi", "Pilar 1", "Pilar 4"],
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
        "E. Mengikuti hasil penelitian terdahulu agar laporan lebih meyakinkan"
      ],
      correctAnswer: "C. Menyajikan data sesuai hasil penelitian dan membahas perbedaannya",
      explanation: "Integritas akademik melarang fabrikasi atau falsifikasi data. Perbedaan data dengan teori adalah khazanah ilmiah yang harus dianalisis secara objektif.",
      baseScore: 12,
      tags: ["Integritas Akademik", "Kejujuran Riset", "Pilar 1", "Pilar 4"],
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
        "E. Ketidaksesuaian penggunaan fasilitas dengan kegiatan mahasiswa"
      ],
      correctAnswer: "C. Pemanfaatan wewenang organisasi untuk kepentingan di luar tanggung jawabnya",
      explanation: "Penyalahgunaan kewenangan (abuse of power) terjadi ketika fasilitas publik/organisasi dimanfaatkan untuk urusan personal tanpa otoritas resmi.",
      baseScore: 13,
      tags: ["Penyalahgunaan Wewenang", "Pilar 1", "Pilar 4"],
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
        "E. Menghindari pembelian barang dengan harga yang tinggi"
      ],
      correctAnswer: "B. Membuat proses pengambilan keputusan dan penggunaan dana lebih terbuka",
      explanation: "Transparansi dan partisipasi anggota dalam proses pengadaan anggaran mencegah kecurigaan, mark-up harga, dan inefisiensi dana organisasi.",
      baseScore: 12,
      tags: ["Transparansi", "Pengambilan Keputusan", "Pilar 1", "Pilar 4"],
    },

    // POS 3: Profil Pelajar Pancasila (5 Soal Benar / Salah)
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "EASY" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Menolak kerja kelompok karena merasa mampu mengerjakan semuanya sendiri menunjukkan sikap mandiri.",
      options: ["Benar", "Salah"],
      correctAnswer: "Salah",
      explanation: "Kemandirian bukan berarti menolak kolaborasi atau individualistis. Kemandirian adalah bertanggung jawab atas proses dan hasil belajarnya sendiri dalam harmoni bersama tim.",
      baseScore: 15,
      tags: ["Sikap Mandiri", "Pilar 1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "EASY" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Mengikuti budaya asing tanpa mempertimbangkan kesesuaiannya dengan nilai yang diyakini merupakan bentuk berkebhinnekaan global.",
      options: ["Benar", "Salah"],
      correctAnswer: "Salah",
      explanation: "Berkebhinekaan global mempertahankan budaya luhur, lokalitas, dan identitasnya, sambil berpikiran terbuka dalam berinteraksi dengan budaya lain tanpa kehilangan jati diri.",
      baseScore: 20,
      tags: ["Berkebhinekaan Global", "Pilar 1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "EASY" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Menjalankan ibadah dengan baik tetapi merendahkan pemeluk agama lain bertentangan dengan karakter berakhlak mulia.",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      explanation: "Akhlak mulia mencakup akhlak beragama dan akhlak kepada sesama manusia, yaitu saling menghargai dan menjunjung tinggi tasamuh (toleransi).",
      baseScore: 20,
      tags: ["Akhlak Mulia", "Pilar 1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "EASY" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Menerima kritik tanpa mengevaluasi kebenarannya bukan merupakan bentuk berpikir kritis.",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      explanation: "Pelajar bernalar kritis mampu secara objektif memproses informasi kualitatif maupun kuantitatif, membangun keterkaitan, dan mengevaluasi validitasnya sebelum menerima.",
      baseScore: 20,
      tags: ["Bernalar Kritis", "Pilar 1"],
    },
    {
      category: "Profil Pelajar Pancasila",
      difficulty: "MEDIUM" as const,
      type: "TRUE_FALSE" as const,
      questionText: "Kelompok yang membagi tugas secara adil tetapi menggunakan cara lama tanpa mencoba memperbaikinya sudah menunjukkan gotong royong, tetapi belum tentu menunjukkan kreativitas.",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      explanation: "Gotong royong terlihat pada pembagian peran dan kolaborasi, sedangkan kreativitas menuntut modifikasi, inovasi, dan orisinalitas dalam menyelesaikan masalah.",
      baseScore: 25,
      tags: ["Gotong Royong & Kreatif", "Pilar 1"],
    },

    // POS 5: Anti Plagiarisme (5 Soal Tebak Kata / Riddle "Siapakah Aku")
    {
      category: "Anti Plagiarisme",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah tindakan mengambil ide, kalimat, atau karya orang lain lalu mengakuinya sebagai hasil karyamu sendiri tanpa izin atau tanpa menyebut sumbernya. Aku adalah musuh utama dunia akademik. Siapakah aku?",
      options: [],
      correctAnswer: "PLAGIAT",
      explanation: "Plagiat adalah penjiplakan yang melanggar hak cipta dan etika kejujuran intelektual.",
      baseScore: 10,
      tags: ["Definisi Plagiat", "Pilar 4"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah bagian kalimat atau paragraf yang kamu ambil persis dari sumber lain, biasanya ditulis di antara tanda petik (\"...\"), dan wajib disebutkan sumbernya. Tanpa aku disebutkan asalnya, kamu bisa dianggap plagiat. Siapakah aku?",
      options: [],
      correctAnswer: "KUTIPAN",
      explanation: "Kutipan langsung atau tidak langsung menghubungkan argumen penulis dengan rujukan literatur yang sah.",
      baseScore: 20,
      tags: ["Teknik Sitasi", "Pilar 4"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah daftar sumber (buku, jurnal, artikel, atau website) yang kamu gunakan saat menulis tugas atau skripsi. Aku biasanya muncul di halaman paling akhir sebuah karya tulis. Tanpa aku, pembaca tidak tahu dari mana ide-ide dalam tulisanmu berasal. Siapakah aku?",
      options: [],
      correctAnswer: "REFERENSI",
      explanation: "Daftar pustaka atau referensi membuktikan kredibilitas rujukan ilmiah penulis.",
      baseScore: 20,
      tags: ["Daftar Pustaka", "Pilar 4"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku adalah nilai kejujuran dalam belajar dan berkarya — tidak menyontek, tidak memalsukan data, dan tidak mengaku karya orang lain sebagai milikmu. Kampus sangat menjunjung tinggi diriku. Siapakah aku?",
      options: [],
      correctAnswer: "INTEGRITAS AKADEMIK",
      explanation: "Integritas akademik merupakan fondasi moral seluruh aktivitas civitas akademika di perguruan tinggi.",
      baseScore: 25,
      tags: ["Etika & Integritas", "Pilar 4"],
    },
    {
      category: "Anti Plagiarisme",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Petunjuk: Aku mirip plagiat, tapi bedanya: yang 'dicuri' adalah karyamu sendiri! Aku terjadi ketika seseorang mengirim ulang atau menerbitkan kembali tulisannya yang lama tanpa memberi keterangan bahwa itu bukan karya baru. Siapakah aku?",
      options: [],
      correctAnswer: "AUTOPLAGIARISME",
      explanation: "Autoplagiarisme atau self-plagiarism adalah pengulangan publikasi karya sendiri tanpa atribusi yang sah.",
      baseScore: 25,
      tags: ["Self-Plagiarism", "Pilar 4"],
    },

    // POS 4: Anti Narkoba (5 Clues TTS)
    {
      category: "Anti Narkoba",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENDATAR. Zat yang dapat menyebabkan ketergantungan dan merusak sistem saraf?",
      options: [],
      correctAnswer: "NARKOBA",
      explanation: "Narkoba merusak sistem saraf pusat dan menyebabkan adiksi berbahaya.",
      baseScore: 20,
      tags: ["TTS", "Mendatar", "Pilar 4"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENDATAR. Kondisi tubuh yang bergantung terus-menerus pada suatu zat.",
      options: [],
      correctAnswer: "KETAGIHAN",
      explanation: "Ketergantungan zat menimbulkan efek toleransi dan withdrawal yang merusak tubuh.",
      baseScore: 20,
      tags: ["TTS", "Mendatar", "Pilar 4"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENURUN. Lawan kata 'kecanduan', kondisi bebas dari pengaruh zat terlarang.",
      options: [],
      correctAnswer: "BEBAS",
      explanation: "Hidup bebas narkoba membuka potensi masa depan yang cerah dan produktif.",
      baseScore: 20,
      tags: ["TTS", "Menurun", "Pilar 4"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENURUN. Tempat rehabilitasi bagi pengguna narkoba biasa disebut panti?",
      options: [],
      correctAnswer: "REHAB",
      explanation: "Panti rehabilitasi membina pemulihan medis dan sosial bagi penyintas adiksi.",
      baseScore: 20,
      tags: ["TTS", "Menurun", "Pilar 4"],
    },
    {
      category: "Anti Narkoba",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Posisi: MENURUN. Sikap menolak dengan tegas terhadap penyalahgunaan narkoba?",
      options: [],
      correctAnswer: "TOLAK",
      explanation: "Keterampilan asertif menolak tawaran narkoba adalah tameng utama mahasiswa.",
      baseScore: 20,
      tags: ["TTS", "Menurun", "Pilar 4"],
    },

    // POS 8: Ingat Aku - Tebak Posisi Lantai Gedung
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto sudut fasilitas amphitheater kampus: Ada di lantai berapakah aku?",
      options: ["Lantai 1", "Lantai 2 amphiteater", "Lantai 3", "Lantai 4"],
      correctAnswer: "Lantai 2 amphiteater",
      explanation: "Amphiteater megah UNU Yogyakarta terletak di Lantai 2.",
      baseScore: 20,
      tags: ["Observasi Fasilitas", "Amphiteater"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto sudut koridor laboratorium: Ada di lantai berapakah aku?",
      options: ["Lantai 2", "Lantai 3", "Lantai 4", "Lantai 5"],
      correctAnswer: "Lantai 4",
      explanation: "Sudut fasilitas tersebut berada di Lantai 4.",
      baseScore: 20,
      tags: ["Observasi Fasilitas", "Lantai 4"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "EASY" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto lobby kedatangan utama: Ada di lantai berapakah aku?",
      options: ["Lantai 1", "Lantai 2", "Lantai 3", "Lantai 6"],
      correctAnswer: "Lantai 1",
      explanation: "Lobby utama kampus berada di Lantai 1.",
      baseScore: 20,
      tags: ["Observasi Fasilitas", "Lantai 1"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto student hub & area diskusi terbuka: Ada di lantai berapakah aku?",
      options: ["Lantai 2", "Lantai 4", "Lantai 5", "Lantai 6"],
      correctAnswer: "Lantai 4",
      explanation: "Student Hub dan ruang advokasi berada di Lantai 4.",
      baseScore: 20,
      tags: ["Observasi Fasilitas", "Lantai 4"],
    },
    {
      category: "Ingat Aku - Posisi",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto selasar Fakultas Teknologi Informasi: Ada di lantai berapakah aku?",
      options: ["Lantai 2", "Lantai 3", "Lantai 4", "Lantai 5"],
      correctAnswer: "Lantai 3",
      explanation: "Fakultas Teknologi Informasi dan lab komputasi berada di Lantai 3.",
      baseScore: 20,
      tags: ["Observasi Fasilitas", "Lantai 3"],
    },

    // POS 9: Ingat Aku - Teks Blur & 3 Tokoh NU
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto papan penunjuk fasilitas yang diblur. Tulisan apakah ini?",
      options: [],
      correctAnswer: "Internet Center",
      explanation: "Teks pada papan dinding tersebut adalah 'Internet Center'.",
      baseScore: 20,
      tags: ["Teks Blur", "Internet Center"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto sudut kreatif mahasiswa yang diblur. Tulisan apakah ini?",
      options: [],
      correctAnswer: "Creative Corner",
      explanation: "Teks pada mural tersebut adalah 'Creative Corner'.",
      baseScore: 20,
      tags: ["Teks Blur", "Creative Corner"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan slogan motivasi dinding kampus yang diblur. Tulisan apakah ini?",
      options: [],
      correctAnswer: "Your Bright Future Starts Here",
      explanation: "Slogan kampus tersebut berbunyi 'Your Bright Future Starts Here'.",
      baseScore: 20,
      tags: ["Teks Blur", "Slogan Kampus"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "MEDIUM" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan poster inkubasi bisnis kampus yang diblur. Tulisan apakah ini?",
      options: [],
      correctAnswer: "Build Ur Own Startup",
      explanation: "Poster program kewirausahaan bertuliskan 'Build Ur Own Startup'.",
      baseScore: 20,
      tags: ["Teks Blur", "Startup"],
    },
    {
      category: "Ingat Aku - Tulisan",
      difficulty: "HARD" as const,
      type: "SHORT_ANSWER" as const,
      questionText: "Perhatikan foto 3 Tokoh Pendiri Nahdlatul Ulama. Siapa nama 3 tokoh ini? Harus urut!",
      options: [],
      correctAnswer: "1. KH. M Hasyim Asyaari, 2. KH. Bisri Syansuri, 3. KH. Abdul Wahab Chasbullah",
      explanation: "Urutan 3 ulama muassis NU: 1. KH. M Hasyim Asy'ari, 2. KH. Bisri Syansuri, 3. KH. Abdul Wahab Chasbullah.",
      baseScore: 20,
      tags: ["Tokoh NU", "Sejarah Aswaja"],
    },
  ];

  for (const q of allQuestions) {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionText, q.questionText))
      .limit(1);

    if (!existing) {
      await db.insert(questions).values({
        category: q.category,
        difficulty: q.difficulty,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        baseScore: q.baseScore,
        tags: q.tags,
        status: "ACTIVE",
      });
    } else {
      await db.update(questions).set({
        category: q.category,
        difficulty: q.difficulty,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        baseScore: q.baseScore,
        tags: q.tags,
        status: "ACTIVE",
      }).where(eq(questions.id, existing.id));
    }
  }

  // 5. SEED MISSIONS LINKING LOCATIONS & GAMES
  console.log("  🎯 Upserting 9 Official Missions...");

  let [stage1] = await db.select().from(stages).where(eq(stages.name, "Stage 1: Campus Discovery (Hari 1)")).limit(1);
  if (!stage1) {
    const allStages = await db.select().from(stages).limit(1);
    if (allStages.length > 0) {
      stage1 = allStages[0];
    } else {
      const [insertedStage] = await db.insert(stages).values({
        name: "Stage 1: Campus Discovery (Hari 1)",
        day: 1,
        description: "Eksplorasi Kampus UNU Yogyakarta & Pembentukan Karakter Unggul",
        status: "ACTIVE",
      }).returning();
      stage1 = insertedStage;
    }
  }

  const allLocations: Array<{ id: string; code: string; name: string }> = await db.select().from(locations);
  const locMap = new Map<string, { id: string; code: string; name: string }>(allLocations.map((l) => [l.code, l]));
  const allGamesList: Array<{ id: string; name: string }> = await db.select().from(games);
  const gameMap = new Map<string, { id: string; name: string }>(allGamesList.map((g) => [g.name, g]));

  const officialMissionsDef = [
    {
      locationCode: "POS-L1-1",
      gameName: "Pos 1 — Studi Kasus Integritas & Anti Korupsi",
      order: 1,
      name: "Tantangan Pos 1 — Anti Korupsi & Terorisme",
      desc: "Selesaikan 8 studi kasus pilihan ganda menguji integritas dan pencegahan intoleransi.",
      timeLimit: 120,
    },
    {
      locationCode: "POS-L2-2",
      gameName: "Pos 2 — Leadership Memory Match",
      order: 2,
      name: "Tantangan Pos 2 — Leadership Memory Match",
      desc: "Mencocokkan 5 pasangan kartu konsep kepemimpinan dengan aksi praktis di organisasi.",
      timeLimit: 90,
    },
    {
      locationCode: "POS-L2-6",
      gameName: "Pos 6 — Media Sosial & Komunikasi Efektif",
      order: 3,
      name: "Tantangan Pos 6 — Media Sosial & Etika Komunikasi",
      desc: "Tantangan kuis etika komunikasi digital dan bermedia sosial yang santun di kampus.",
      timeLimit: 120,
    },
    {
      locationCode: "POS-L3-3",
      gameName: "Pos 3 — Benar atau Salah Pelajar Pancasila",
      order: 4,
      name: "Tantangan Pos 3 — Profil Pelajar Pancasila",
      desc: "Evaluasi 5 pernyataan Benar/Salah nilai luhur Pancasila dan penalaran kritis.",
      timeLimit: 90,
    },
    {
      locationCode: "POS-L4-4",
      gameName: "Pos 4 — TTS Kampus Bersinar Bebas Narkoba",
      order: 5,
      name: "Tantangan Pos 4 — Kampus Bersinar Anti Narkoba",
      desc: "Teka-Teki Silang (TTS) 5 kata kunci gaya hidup sehat dan pencegahan narkoba.",
      timeLimit: 120,
    },
    {
      locationCode: "POS-L4-9",
      gameName: "Pos 9 — Ingat Aku: Teks Blur & 3 Tokoh NU",
      order: 6,
      name: "Tantangan Pos 9 — Ingat Aku: Teks Blur & Tokoh NU",
      desc: "Uji ketelitian membaca teks dinding kampus yang diblur dan susunan 3 tokoh pendiri NU.",
      timeLimit: 90,
    },
    {
      locationCode: "POS-L5-5",
      gameName: "Pos 5 — Tebak Kata Siapakah Aku: Anti Plagiarisme",
      order: 7,
      name: "Tantangan Pos 5 — Anti Plagiarisme & Riset Ilmiah",
      desc: "Tebak kata sandi riddle 'Siapakah Aku?' dunia akademik dan sitasi ilmiah.",
      timeLimit: 120,
    },
    {
      locationCode: "POS-L6-7",
      gameName: "Pos 7 — Fun Pos Tebak Gambar Kreatif",
      order: 8,
      name: "Tantangan Pos 7 — Fun Pos Tebak Gambar",
      desc: "Tantangan tebak visual gambar dan observasi kampus yang seru bersama tim.",
      timeLimit: 60,
    },
    {
      locationCode: "POS-L6-8",
      gameName: "Pos 8 — Ingat Aku: Tebak Lokasi Lantai Gedung",
      order: 9,
      name: "Tantangan Pos 8 — Tebak Posisi Lantai Gedung",
      desc: "Tebak lokasi lantai berdasarkan 5 foto sudut fasilitas kampus UNU.",
      timeLimit: 60,
    },
  ];

  const officialLocIds: string[] = [];

  for (const m of officialMissionsDef) {
    const loc = locMap.get(m.locationCode);
    const g = gameMap.get(m.gameName);
    if (!loc || !g || !stage1) {
      console.warn(`  ⚠️ Skip mission ${m.name}: loc=${!!loc}, game=${!!g}`);
      continue;
    }
    officialLocIds.push(loc.id);

    const [existing] = await db.select().from(missions).where(eq(missions.locationId, loc.id)).limit(1);
    if (!existing) {
      await db.insert(missions).values({
        name: m.name,
        description: m.desc,
        type: "MAIN",
        locationId: loc.id,
        stageId: stage1.id,
        gameId: g.id,
        order: m.order,
        timeLimit: m.timeLimit,
        status: "ACTIVE",
      });
    } else {
      await db.update(missions).set({
        name: m.name,
        description: m.desc,
        stageId: stage1.id,
        gameId: g.id,
        order: m.order,
        timeLimit: m.timeLimit,
        status: "ACTIVE",
      }).where(eq(missions.id, existing.id));
    }
  }

  // Deactivate old dummy missions that are not in the 9 official locations
  if (officialLocIds.length > 0) {
    const allOldMissions: Array<{ id: string; locationId: string }> = await db.select().from(missions);
    for (const oldM of allOldMissions) {
      if (!officialLocIds.includes(oldM.locationId)) {
        await db.update(missions).set({ status: "INACTIVE" }).where(eq(missions.id, oldM.id));
      }
    }
  }

  console.log(`✅ Success! Seeded 6 Floors, 9 Locations, 9 Games, 9 Missions, and ${allQuestions.length} Questions.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
