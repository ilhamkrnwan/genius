import { db } from "../src/db";
import { ormawaBooths, floors } from "../src/db/schema";
import { eq } from "drizzle-orm";

export const OFFICIAL_ORMAWA_LIST = [
  {
    code: "ORMAWA-HMTE",
    name: "Himpunan Mahasiswa Teknik Elektro (HMTE)",
    shortName: "HMTE",
    category: "Himpunan Mahasiswa",
    floorNum: 3,
    boothNumber: "E-01",
    description: "Wadah aspirasi, kreativitas, riset keteknikan, dan pengembangan kompetensi mahasiswa Teknik Elektro UNU Yogyakarta.",
    qrCode: "UNU-ORMAWA-HMTE-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-02",
    description: "Organisasi keprofesian dan keilmuan mahasiswa Farmasi dalam pengembangan sains obat halal, klinis, dan herbal nusantara.",
    qrCode: "UNU-ORMAWA-HIMAFAR-2026",
    xpReward: 2,
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
    floorNum: 3,
    boothNumber: "E-03",
    description: "Komunitas musisi kampus penampung minat band, akustik, aransemen lagu, audio engineering, dan panggung apresiasi nada.",
    qrCode: "UNU-ORMAWA-MUSIK-2026",
    xpReward: 2,
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
    floorNum: 5,
    boothNumber: "E-04",
    description: "Wadah kajian intelektual Islam kontemporer, dialog antar peradaban, sosiologi keagamaan, dan integrasi studi Islam interdisipliner.",
    qrCode: "UNU-ORMAWA-HIMASII-2026",
    xpReward: 2,
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
    floorNum: 3,
    boothNumber: "E-05",
    description: "Paduan suara resmi representasi universitas dalam kompetisi paduan suara, konser harmoni kebangsaan, dan protokoler wisuda.",
    qrCode: "UNU-ORMAWA-PADUS-2026",
    xpReward: 2,
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
    floorNum: 3,
    boothNumber: "E-06",
    description: "Himpunan pemersatu mahasiswa informatika, pengembang software engineering, data science, cybersecurity, dan kompetisi Gemastik.",
    qrCode: "UNU-ORMAWA-HIMATIKA-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-07",
    description: "Penggerak agrososiopreneur modern, rantai pasok pangan berkelanjutan, dan pemberdayaan petani milenial berbasis inovasi cerdas.",
    qrCode: "UNU-ORMAWA-HIMAGRI-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-08",
    description: "Organisasi kemahasiswaan riset pengolahan pangan halal, bioteknologi pangan nusantara, mikrobiologi terapan, dan ketahanan pangan.",
    qrCode: "UNU-ORMAWA-HMP-THP-2026",
    xpReward: 2,
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
    floorNum: 5,
    boothNumber: "E-09",
    description: "Wadah pengembangan keahlian akuntansi forensik, audit syariah, financial analysis, dan perpajakan di era transformasi digital.",
    qrCode: "UNU-ORMAWA-HIMATANSI-2026",
    xpReward: 2,
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
    floorNum: 5,
    boothNumber: "E-10",
    description: "Pusat pembinaan tilawatil Qur'an, tahfizh, kajian tartil, serta dialektika debat dan percakapan bahasa Arab mahasiswa.",
    qrCode: "UNU-ORMAWA-JQH-IAC-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-11",
    description: "Wadah atlet dan peminat olahraga bulutangkis untuk pembinaan teknik, sparring berkala, dan kejuaraan pekan olahraga mahasiswa.",
    qrCode: "UNU-ORMAWA-BADMINTON-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-12",
    description: "Organisasi penggiat alam bebas, konservasi rimba gunung, susur gua (caving), rock climbing, dan tanggap darurat search & rescue.",
    qrCode: "UNU-ORMAWA-MAPALA-2026",
    xpReward: 2,
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
    floorNum: 3,
    boothNumber: "E-13",
    description: "Kawah candradimuka pesilat Nahdlatul Ulama yang memadukan keindahan jurus tradisional, adu tanding fisik, dan nilai ksatria Aswaja.",
    qrCode: "UNU-ORMAWA-SILAT-2026",
    xpReward: 2,
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
    floorNum: 3,
    boothNumber: "E-14",
    description: "Ruang gerak estetika dan koreografi penari muda dalam melestarikan tarian klasik nusantara serta kreasi tari kontemporer.",
    qrCode: "UNU-ORMAWA-TARI-2026",
    xpReward: 2,
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
    floorNum: 5,
    boothNumber: "E-15",
    description: "Wadah calon pendidik bangsa berkarakter inklusif, pengembang media pembelajaran interaktif, microteaching, dan pendidikan anak abad 21.",
    qrCode: "UNU-ORMAWA-HIMA-PGSD-2026",
    xpReward: 2,
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
    floorNum: 5,
    boothNumber: "E-16",
    description: "Komunitas calon guru dan profesional bahasa Inggris, penyelenggara English speech, drama festival, and global pedagogical insights.",
    qrCode: "UNU-ORMAWA-HMP-PBI-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-17",
    description: "Garda terdepan kemanusiaan kampus dalam layanan P3K cepat tanggap, donor darah teratur, edukasi tanggap bencana, dan bakti kesehatan.",
    qrCode: "UNU-ORMAWA-KSR-2026",
    xpReward: 2,
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
    floorNum: 4,
    boothNumber: "E-18",
    description: "Rumah kekeluargaan dan persatuan mahasiswa rantau asal pulau Sumatera di UNU Yogyakarta untuk pelestarian adat, seni, dan sinergi daerah.",
    qrCode: "UNU-ORMAWA-PERMASUM-2026",
    xpReward: 2,
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
    floorNum: 5,
    boothNumber: "E-19",
    description: "Inkubator calon manajer dan entrepreneur unggul dalam strategi bisnis digital, pemasaran modern, tata kelola korporasi, dan inovasi startup.",
    qrCode: "UNU-ORMAWA-HMPM-2026",
    xpReward: 2,
    badgeIcon: "Briefcase",
    badgeColor: "#7c3aed",
    contactPerson: "Muhammad Farits Nauval (NIM 244441014) - 085742923549",
    instagram: "@hmpm_unujogja",
  },
];

async function migrateOrmawa() {
  console.log("🏛️  Starting Migration of 19 Official Ormawa Booths...");

  // Ambil data lantai untuk mapping foreign key floorId
  const dbFloors = await db.select().from(floors);
  const floorMap = new Map<number, string>();
  for (const fl of dbFloors) {
    floorMap.set(fl.number, fl.id);
  }

  // Hapus booth dummy lama yang tidak ada di daftar resmi
  const validCodes = OFFICIAL_ORMAWA_LIST.map((o) => o.code);
  const allCurrentBooths = await db.select().from(ormawaBooths);
  for (const b of allCurrentBooths) {
    if (!validCodes.includes(b.code)) {
      console.log(`  🗑️ Removing old non-official booth: ${b.code} (${b.name})`);
      await db.delete(ormawaBooths).where(eq(ormawaBooths.id, b.id));
    }
  }

  // Upsert seluruh 19 Ormawa
  let upsertedCount = 0;
  for (const item of OFFICIAL_ORMAWA_LIST) {
    const floorId = floorMap.get(item.floorNum) || null;

    const values = {
      code: item.code,
      name: item.name,
      shortName: item.shortName,
      category: item.category,
      floorId: floorId,
      boothNumber: item.boothNumber,
      description: item.description,
      stampInstructions: [
        "Datangi stan dan kenali program Ormawa atau UKM.",
        "Selesaikan misi yang diberikan oleh PIC stan.",
        "Buka QR profilmu dan minta PIC memindainya untuk menerima stamp.",
      ],
      qrCode: item.qrCode,
      xpReward: item.xpReward,
      badgeIcon: item.badgeIcon,
      badgeColor: item.badgeColor,
      contactPerson: item.contactPerson,
      instagram: item.instagram,
      isActive: true,
    };

    const [existing] = await db
      .select()
      .from(ormawaBooths)
      .where(eq(ormawaBooths.code, item.code))
      .limit(1);

    if (!existing) {
      await db.insert(ormawaBooths).values(values);
      console.log(`  ➕ Inserted: ${item.boothNumber} ${item.name}`);
    } else {
      await db.update(ormawaBooths).set(values).where(eq(ormawaBooths.id, existing.id));
      console.log(`  🔄 Updated: ${item.boothNumber} ${item.name}`);
    }
    upsertedCount++;
  }

  console.log(`✅ Successfully migrated and verified all ${upsertedCount} Ormawa Booths!`);
  process.exit(0);
}

if (import.meta.main) {
  migrateOrmawa().catch((err) => {
    console.error("❌ Ormawa Migration failed:", err);
    process.exit(1);
  });
}
