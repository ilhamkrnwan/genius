export interface OfficialBuddySeed {
  num: number;
  nim: string;
  fullName: string;
  prodi: string;
  faculty: string;
  gender: "MALE" | "FEMALE";
  slug: string;
}

export const RAW_BUDDY_DATA: OfficialBuddySeed[] = [
  { num: 1, nim: "244441009", fullName: "Agnes Anggraini Risdiyanto", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "agnes" },
  { num: 2, nim: "241113023", fullName: "Agnesya Putri Triyana", prodi: "Teknik Elektro", faculty: "Fakultas Teknologi Informasi", gender: "FEMALE", slug: "agnesya" },
  { num: 3, nim: "254442032", fullName: "Ahmad Fadlil Munajad", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "MALE", slug: "fadlil" },
  { num: 4, nim: "253331011", fullName: "Ahmad Ichsan Maulana", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "MALE", slug: "ichsan" },
  { num: 5, nim: "255551020", fullName: "Aning Gusmi Rahayu", prodi: "Studi Islam Interdisipliner", faculty: "Fakultas Dirasat Islamiyah", gender: "FEMALE", slug: "aning" },
  { num: 6, nim: "243331025", fullName: "Arselia Sakina", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "arselia" },
  { num: 7, nim: "252222001", fullName: "Asadurrahman Mujtaba Alhamidy", prodi: "Pendidikan Bahasa Inggris", faculty: "Fakultas Ilmu Pendidikan", gender: "MALE", slug: "asadurrahman" },
  { num: 8, nim: "244442090", fullName: "Dafa Alif Laguna", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "MALE", slug: "dafa" },
  { num: 9, nim: "253333063", fullName: "Destiya Lintang Dwi Utami", prodi: "Farmasi", faculty: "Fakultas Ilmu Kesehatan", gender: "FEMALE", slug: "destiya" },
  { num: 10, nim: "244442047", fullName: "Dzulfa Sindi Saputri", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "dzulfa" },
  { num: 11, nim: "251113011", fullName: "Eka Setiawan", prodi: "Teknik Elektro", faculty: "Fakultas Teknologi Informasi", gender: "MALE", slug: "ekasetiawan" },
  { num: 12, nim: "243331023", fullName: "Farazinia Aditiani Putri", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "farazinia" },
  { num: 13, nim: "251111068", fullName: "Fathi Rizqy Ramadhan", prodi: "Informatika", faculty: "Fakultas Teknologi Informasi", gender: "MALE", slug: "fathi" },
  { num: 14, nim: "245551064", fullName: "Fauza Ramadani", prodi: "Studi Islam Interdisipliner", faculty: "Fakultas Dirasat Islamiyah", gender: "FEMALE", slug: "fauza" },
  { num: 15, nim: "242222012", fullName: "Fina Nur Jayanti", prodi: "Pendidikan Bahasa Inggris", faculty: "Fakultas Ilmu Pendidikan", gender: "FEMALE", slug: "fina" },
  { num: 16, nim: "244442083", fullName: "Isna Shabrina Berliana", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "isna" },
  { num: 17, nim: "251113016", fullName: "Istiqomah Kurniawati", prodi: "Teknik Elektro", faculty: "Fakultas Teknologi Informasi", gender: "FEMALE", slug: "istiqomah" },
  { num: 18, nim: "254441070", fullName: "Jernikan Qalbi Zauqillah", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "jernikan" },
  { num: 19, nim: "245551074", fullName: "Khansa Saifanah Khair", prodi: "Studi Islam Interdisipliner", faculty: "Fakultas Dirasat Islamiyah", gender: "FEMALE", slug: "khansa" },
  { num: 20, nim: "244441101", fullName: "Khoirunnisa Aulia Rahmah", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "khoirunnisa" },
  { num: 21, nim: "254442003", fullName: "Moh. Dimas Adi Putra", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "MALE", slug: "dimas" },
  { num: 22, nim: "251111048", fullName: "Mohamad Budi Wibowo", prodi: "Informatika", faculty: "Fakultas Teknologi Informasi", gender: "MALE", slug: "budi" },
  { num: 23, nim: "241113032", fullName: "Mohammad Hilman Umami", prodi: "Teknik Elektro", faculty: "Fakultas Teknologi Informasi", gender: "MALE", slug: "hilman" },
  { num: 24, nim: "255551025", fullName: "Muhammad Ma'shum", prodi: "Studi Islam Interdisipliner", faculty: "Fakultas Dirasat Islamiyah", gender: "MALE", slug: "mashum" },
  { num: 25, nim: "243332036", fullName: "Muhammad Naufal Rosyiq Ammar", prodi: "Teknologi Hasil Pertanian", faculty: "Fakultas Bioindustri", gender: "MALE", slug: "naufal" },
  { num: 26, nim: "255551012", fullName: "Muhammad Pradana Sidiq Nurcahyo", prodi: "Studi Islam Interdisipliner", faculty: "Fakultas Dirasat Islamiyah", gender: "MALE", slug: "pradana" },
  { num: 27, nim: "253333048", fullName: "Mutiara Nisa Cahya Kusuma", prodi: "Farmasi", faculty: "Fakultas Ilmu Kesehatan", gender: "FEMALE", slug: "mutiara" },
  { num: 28, nim: "252222009", fullName: "Nazriel Rizky Fadilah", prodi: "Pendidikan Bahasa Inggris", faculty: "Fakultas Ilmu Pendidikan", gender: "MALE", slug: "nazriel" },
  { num: 29, nim: "244441067", fullName: "Nur Raihana Zulfa", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "raihana" },
  { num: 30, nim: "252221006", fullName: "Nurhidayah Irawan", prodi: "Pendidikan Guru Sekolah Dasar (PGSD)", faculty: "Fakultas Ilmu Pendidikan", gender: "FEMALE", slug: "nurhidayah" },
  { num: 31, nim: "254441013", fullName: "Orryza Sativa Qurrota A'yun", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "orryza" },
  { num: 32, nim: "253331006", fullName: "Pandu Alfa Pratama", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "MALE", slug: "pandu" },
  { num: 33, nim: "244442027", fullName: "Ramanda", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "MALE", slug: "ramanda" },
  { num: 34, nim: "253331001", fullName: "Refina Aprillia", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "refina" },
  { num: 35, nim: "244442076", fullName: "Rizka Sonia Octavia", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "rizkasonia" },
  { num: 36, nim: "244442084", fullName: "Rizki Nur Aini", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "rizkinur" },
  { num: 37, nim: "253331034", fullName: "Sakina Tasya", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "sakinatasya" },
  { num: 38, nim: "244441024", fullName: "Salis Nawalin Najah", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "salis" },
  { num: 39, nim: "254442013", fullName: "Sevia Mila Sari", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "sevia" },
  { num: 40, nim: "243331026", fullName: "Siti Via Syahrani Putri", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "sitivia" },
  { num: 41, nim: "254441066", fullName: "Sovi Sarah", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "FEMALE", slug: "sovisarah" },
  { num: 42, nim: "255551005", fullName: "Sukma Maulana Pangesti", prodi: "Studi Islam Interdisipliner", faculty: "Fakultas Dirasat Islamiyah", gender: "MALE", slug: "sukma" },
  { num: 43, nim: "253333045", fullName: "Talitha Zerlina Aurellia", prodi: "Farmasi", faculty: "Fakultas Ilmu Kesehatan", gender: "FEMALE", slug: "talitha" },
  { num: 44, nim: "254441052", fullName: "Usman Raya", prodi: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis", gender: "MALE", slug: "usman" },
  { num: 45, nim: "254442011", fullName: "Yoga Rama Indardy", prodi: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis", gender: "MALE", slug: "yoga" },
  { num: 46, nim: "252221043", fullName: "Yulita Wahyu Utami", prodi: "Pendidikan Guru Sekolah Dasar (PGSD)", faculty: "Fakultas Ilmu Pendidikan", gender: "FEMALE", slug: "yulita" },
  { num: 47, nim: "253331017", fullName: "Zahra Audrina Fadhilah", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "zahra" },
  { num: 48, nim: "243331017", fullName: "Zahro Makhbubah", prodi: "Agribisnis", faculty: "Fakultas Bioindustri", gender: "FEMALE", slug: "zahro" },
  { num: 49, nim: "251113012", fullName: "Zakiya Aisyah Dealatifa", prodi: "Teknik Elektro", faculty: "Fakultas Teknologi Informasi", gender: "FEMALE", slug: "zakiya" },
  { num: 50, nim: "253333050", fullName: "Zulaika", prodi: "Farmasi", faculty: "Fakultas Ilmu Kesehatan", gender: "FEMALE", slug: "zulaika" },
];
