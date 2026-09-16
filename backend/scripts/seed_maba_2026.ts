import { resolve } from 'path';
// 1. Sesuaikan path import instance db & schema tabel users di folder src project kamu
import { db } from '../src/db';
import { users } from '../src/db/schema';

// Path ke file maba_2026.csv di root project
const filePath = resolve(import.meta.dir, '../../maba_2026.csv');

async function runSeed() {
    console.log('📖 Memeriksa file CSV di:', filePath);

    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
        console.error(`❌ File CSV tidak ditemukan di: ${filePath}`);
        process.exit(1);
    }

    const content = await file.text();
    // Pisahkan baris & buang baris kosong
    const lines = content.trim().split(/\r?\n/).filter(Boolean);

    if (lines.length <= 1) {
        console.error('❌ File CSV kosong atau hanya berisi header.');
        process.exit(1);
    }

    // Parse header kolom
    const headers = lines[0].split(',').map((h) => h.replace(/["\r]/g, '').trim());
    const usernameIdx = headers.indexOf('username');
    const fullNameIdx = headers.indexOf('full_name');
    const genderIdx = headers.indexOf('gender');

    // Ambil data baris
    const rows = lines.slice(1).map((line) => {
        // Memisahkan koma tetapi mengabaikan koma di dalam tanda kutip (misal nama dengan gelar/tanda petik)
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
            c.replace(/^"|"$/g, '').trim()
        );

        return {
            username: cols[usernameIdx],
            fullName: cols[fullNameIdx],
            gender: cols[genderIdx],
        };
    });

    console.log(`🔍 Ditemukan ${rows.length} data mahasiswa.`);

    // Buat hash password default (misal: password123) menggunakan fitur bawaan Bun
    console.log('🔐 Menyiapkan password hash default...');
    const defaultPasswordHash = await Bun.password.hash('password123', {
        algorithm: 'bcrypt',
        cost: 10,
    });

    // Petakan ke kolom tabel users Drizzle
    // PERHATIAN: Sesuaikan penamaan properti di bawah dengan kolom di schema Drizzle kamu
    // (misal: fullName vs full_name, passwordHash vs password_hash)
    const formattedUsers = rows.map((row) => ({
        username: row.username,
        fullName: row.fullName,
        passwordHash: defaultPasswordHash,
        gender: row.gender, // Hapus baris ini jika tabel users kamu tidak punya kolom gender
        role: 'PARTICIPANT' as const,
        status: 'ACTIVE' as const,
    }));

    console.log('🚀 Memasukkan data ke PostgreSQL via Drizzle ORM...');

    // Masukkan per batch (100 baris per query agar ringan dan cepat)
    const batchSize = 100;
    for (let i = 0; i < formattedUsers.length; i += batchSize) {
        const batch = formattedUsers.slice(i, i + batchSize);

        // Gunakan onConflictDoNothing() agar jika ada username yang sudah terdaftar tidak bentrok
        await db.insert(users).values(batch).onConflictDoNothing();
        console.log(`   -> Memproses ${Math.min(i + batchSize, formattedUsers.length)}/${formattedUsers.length} data...`);
    }

    console.log('✅ Selesai! Semua data mahasiswa berhasil dimasukkan ke tabel users.');
    process.exit(0);
}

runSeed().catch((err) => {
    console.error('❌ Terjadi kesalahan saat seeding:', err);
    process.exit(1);
});