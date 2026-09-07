import { db } from "../src/db";
import { floors, locations } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating floors and locations to official names without Zona Barat/Timur...");

  const officialFloors = [
    {
      number: 1,
      name: "Lantai 1 - Welcome Hall & Karakter Kampus",
      description: "Lobby utama megah, pusat layanan mahasiswa baru, dan pengenalan karakter Aswaja An-Nahdliyyah.",
      locations: [
        { code: "POS-L1-A", name: "Lobby Utama & Welcome Center", desc: "Corner Nilai Dasar, Tradisi Aswaja & Karakter Kampus UNU", qr: "UNU-QR-L1-A-2026" },
        { code: "POS-L1-B", name: "Student Center & Layanan Kampus", desc: "Etika Kampus, Tata Krama Mahasiswa & Komunitas Kampus", qr: "UNU-QR-L1-B-2026" },
      ]
    },
    {
      number: 2,
      name: "Lantai 2 - Kesehatan & Ketahanan Mahasiswa",
      description: "Pusat ketahanan diri, well-being, klinik kampus, konseling sebaya, dan kampus bebas narkoba.",
      locations: [
        { code: "POS-L2-A", name: "Klinik & Posko Kesehatan Mahasiswa", desc: "Layanan Kesehatan, P3K, Well-being & Ketahanan Fisik", qr: "UNU-QR-L2-A-2026" },
        { code: "POS-L2-B", name: "Kampus Bersinar & Konseling Sebaya", desc: "Komitmen Kampus Bersih Narkoba, Edukasi Anti-Rokok & Mental Health", qr: "UNU-QR-L2-B-2026" },
      ]
    },
    {
      number: 3,
      name: "Lantai 3 - Ruang Kolaborasi & Soft Skills",
      description: "Fakultas Teknologi Informasi, lab komputasi AI, serta area asah kepemimpinan dan komunikasi asertif.",
      locations: [
        { code: "POS-L3-A", name: "Lab Komputer AI & Software Studio", desc: "Algoritma Cerdas, Pemrograman Masa Depan & Literasi Digital", qr: "UNU-QR-L3-A-2026" },
        { code: "POS-L3-B", name: "Smart FTI Hall & Ruang Kolaborasi", desc: "Komunikasi Efektif, Negosiasi & Kepemimpinan Inklusif", qr: "UNU-QR-L3-B-2026" },
      ]
    },
    {
      number: 4,
      name: "Lantai 4 - Student Hub & Satgas PPKS",
      description: "Pusat advokasi hak mahasiswa, pencegahan kekerasan seksual (PPKS), anti perundungan, dan riset halal.",
      locations: [
        { code: "POS-L4-A", name: "Posko Layanan PPKS & Konseling Ramah", desc: "Kanal Pengaduan Aman, Perlindungan Korban & Anti-Perundungan", qr: "UNU-QR-L4-A-2026" },
        { code: "POS-L4-B", name: "Lab Riset Halal & Bioteknologi Terapan", desc: "Standarisasi Halal, Sains Industri & Keberlanjutan Hayati", qr: "UNU-QR-L4-B-2026" },
      ]
    },
    {
      number: 5,
      name: "Lantai 5 - Perpustakaan & Knowledge Hub",
      description: "Pustaka modern kampus, akses jurnal internasional, literasi digital, dan integritas penulisan karya ilmiah.",
      locations: [
        { code: "POS-L5-A", name: "Perpustakaan Pusat & Pustaka Digital", desc: "Akses Repositori Ilmiah, Database Jurnal & Khazanah Pustaka", qr: "UNU-QR-L5-A-2026" },
        { code: "POS-L5-B", name: "Klinik Anti-Plagiarisme & Penulisan Ilmiah", desc: "Kaidah Sitasi Orisinil, Etika Informasi & Kejujuran Akademik", qr: "UNU-QR-L5-B-2026" },
      ]
    },
    {
      number: 6,
      name: "Lantai 6 - Laboratorium Riset & Inovasi",
      description: "Laboratorium terpadu sains terapan, kajian Islam Nusantara, bahasa global, dan inovasi energi hijau.",
      locations: [
        { code: "POS-L6-A", name: "Pusat Studi Islam Nusantara & Budaya", desc: "Kajian Moderasi Beragama, Wawasan Kebangsaan & Nilai Aswaja", qr: "UNU-QR-L6-A-2026" },
        { code: "POS-L6-B", name: "Laboratorium Sains Terpadu & Energi Hijau", desc: "Riset Multidisiplin Berkelanjutan, SDGs & Green Science", qr: "UNU-QR-L6-B-2026" },
      ]
    },
    {
      number: 7,
      name: "Lantai 7 - Inkubator Kreatif & Technopreneur",
      description: "Wadah inovasi startup digital mahasiswa, artificial intelligence beretika, studio multimedia, dan microteaching.",
      locations: [
        { code: "POS-L7-A", name: "Creative Co-Working Space & Multimedia", desc: "Ideasi Bisnis, AI Beretika, Desain Kreatif & Visual Digital", qr: "UNU-QR-L7-A-2026" },
        { code: "POS-L7-B", name: "Microteaching Lab & Karakter Pendidik", desc: "Simulasi Mengajar Inovatif & Metodologi Pembelajaran Abad 21", qr: "UNU-QR-L7-B-2026" },
      ]
    },
    {
      number: 8,
      name: "Lantai 8 - Zona Integritas & Good Governance",
      description: "Kantor pimpinan universitas, dewan pertimbangan kampus, dan penanaman 9 nilai integritas antikorupsi.",
      locations: [
        { code: "POS-L8-A", name: "Klinik Integritas & Anti-Korupsi", desc: "Pendidikan Antikorupsi, Tolak Gratifikasi & Nilai Kejujuran", qr: "UNU-QR-L8-A-2026" },
        { code: "POS-L8-B", name: "Ruang Tata Kelola & Kepemimpinan Kampus", desc: "Transparansi, Akuntabilitas & Tata Kelola Perguruan Tinggi", qr: "UNU-QR-L8-B-2026" },
      ]
    },
    {
      number: 9,
      name: "Lantai 9 - Puncak Transformasi & Mahakarya",
      description: "Convention hall megah, arena grand ceremony, rooftop panoramic sky garden, dan ikrar Upgraded You.",
      locations: [
        { code: "POS-L9-A", name: "Auditorium & Convention Hall Utama", desc: "Arena Sidang Pleno, Grand Quest & Ikrar Mahasiswa Unggul", qr: "UNU-QR-L9-A-2026" },
        { code: "POS-L9-B", name: "Rooftop Sky Garden Panoramic Deck", desc: "Visi Indonesia Emas 2045, Epilog & Selebrasi Puncak Transformasi", qr: "UNU-QR-L9-B-2026" },
      ]
    },
  ];

  for (const item of officialFloors) {
    const [existingFloor] = await db.select().from(floors).where(eq(floors.number, item.number)).limit(1);
    let floorId = existingFloor?.id;

    if (!existingFloor) {
      const [newFloor] = await db.insert(floors).values({
        number: item.number,
        name: item.name,
        description: item.description,
      }).returning();
      floorId = newFloor.id;
      console.log(`Created floor ${item.number}`);
    } else {
      await db.update(floors).set({
        name: item.name,
        description: item.description,
      }).where(eq(floors.id, floorId));
      console.log(`Updated floor ${item.number}`);
    }

    // Update locations for this floor
    for (const loc of item.locations) {
      const [existingLoc] = await db.select().from(locations).where(eq(locations.code, loc.code)).limit(1);
      if (existingLoc) {
        await db.update(locations).set({
          name: loc.name,
          description: loc.desc,
          qrCode: loc.qr,
          status: "AVAILABLE",
        }).where(eq(locations.id, existingLoc.id));
      } else {
        await db.insert(locations).values({
          code: loc.code,
          name: loc.name,
          description: loc.desc,
          qrCode: loc.qr,
          floorId: floorId,
          status: "AVAILABLE",
          capacity: 10,
        });
      }
    }
  }

  console.log("✅ Successfully updated all 9 floors and 18 locations!");
}

main().catch(console.error);
