import { db } from "../src/db";
import { users, teams, teamMembers, ormawaBooths, floors } from "../src/db/schema";
import fs from "fs";
import path from "path";

async function main() {
  const allUsers = await db.select().from(users);
  const allTeams = await db.select().from(teams);
  const allMembers = await db.select().from(teamMembers);
  const allBooths = await db.select().from(ormawaBooths);
  const allFloors = await db.select().from(floors);

  let out = "";
  out += "================================================================================\n";
  out += "              GENIUS UNU YOGYAKARTA 2026 — DAFTAR KREDENSIAL LOGIN & ROLE       \n";
  out += "================================================================================\n\n";

  out += "📌 RINGKASAN PORTAL & AKSES:\n";
  out += "--------------------------------------------------------------------------------\n";
  out += "1. PORTAL ADMIN, BUDDY & ORMAWA : http://localhost:3002/login (Production: :4002)\n";
  out += "   - Super Admin       ➔ Otomatis diarahkan ke Control Center Utama (/)\n";
  out += "   - Game Master Buddy ➔ Otomatis diarahkan ke Portal Mobile-First Buddy (/buddy)\n";
  out += "   - PIC Stan Ormawa   ➔ Otomatis diarahkan ke Portal Mandiri Stan (/ormawa/portal)\n\n";
  out += "2. APLIKASI USER MAHASISWA BARU : http://localhost:3000 (Production: :4000)\n";
  out += "   - Peserta Maba login menggunakan NIM dan kata sandi.\n";
  out += "--------------------------------------------------------------------------------\n\n";

  out += "================================================================================\n";
  out += "1. AKUN SUPER ADMINISTRATOR (KONTROL MASTER SISTEM)\n";
  out += "================================================================================\n";
  out += "Role       : ADMIN\n";
  out += "Portal URL : http://localhost:3002/login ➔ /\n";
  out += "Username   : admin\n";
  out += "Password   : admin2026\n";
  out += "Nama       : Administrator GENIUS 2026\n\n";

  out += "================================================================================\n";
  out += "2. AKUN GAME MASTER BUDDY (10 BUDDY — PENILAIAN FGD & PRESENSI REGU)\n";
  out += "================================================================================\n";
  out += "Role       : BUDDY\n";
  out += "Portal URL : http://localhost:3002/login ➔ /buddy\n";
  out += "Password   : genius2026\n\n";

  const buddies = allUsers.filter((u) => u.role === "BUDDY").sort((a, b) => a.username.localeCompare(b.username));
  buddies.forEach((b, idx) => {
    const teamMem = allMembers.find((m) => m.userId === b.id);
    const team = teamMem ? allTeams.find((t) => t.id === teamMem.teamId) : null;
    const teamStr = team ? team.name + " (" + team.code + ")" : "Regu Pendamping";
    out += `[${idx + 1}] NIM/Username : ${b.username} | Password: genius2026\n`;
    out += `    Nama Lengkap : ${b.fullName}\n`;
    out += `    Penugasan    : ${teamStr}\n\n`;
  });

  out += "================================================================================\n";
  out += "3. AKUN PIC STAN ORMAWA / UKM EXPO (19 STAN RESMI LANTAI 3, 4, 5)\n";
  out += "================================================================================\n";
  out += "Role       : ORMAWA_PIC\n";
  out += "Portal URL : http://localhost:3002/login ➔ /ormawa/portal\n";
  out += "Password   : ormawa2026\n\n";

  const pics = allUsers.filter((u) => u.role === "ORMAWA_PIC").sort((a, b) => a.username.localeCompare(b.username));
  pics.forEach((p, idx) => {
    const booth = allBooths.find((b) => b.picUserId === p.id);
    const floor = booth ? allFloors.find((f) => f.id === booth.floorId) : null;
    const floorStr = floor ? "Lantai " + floor.number : "Lantai Expo";
    const boothName = booth ? booth.name : p.fullName;
    const boothNum = booth ? booth.boothNumber : "-";
    const qrCode = booth ? booth.qrCode : "-";
    out += `[${idx + 1}] Username     : ${p.username} | Password: ormawa2026\n`;
    out += `    Nama Stan    : ${boothName}\n`;
    out += `    Lokasi Stan  : ${floorStr} (Booth ${boothNum})\n`;
    out += `    Token QR     : ${qrCode}\n\n`;
  });

  out += "================================================================================\n";
  out += "4. AKUN MAHASISWA BARU / PESERTA (100 MABA RESMI)\n";
  out += "================================================================================\n";
  out += "Role       : PARTICIPANT\n";
  out += "Portal URL : http://localhost:3000 (Aplikasi User Maba)\n";
  out += "Password   : genius2026 (Default untuk seluruh MABA)\n\n";

  const mabas = allUsers.filter((u) => u.role === "PARTICIPANT").sort((a, b) => a.username.localeCompare(b.username));
  mabas.forEach((m, idx) => {
    const teamMem = allMembers.find((tm) => tm.userId === m.id);
    const team = teamMem ? allTeams.find((t) => t.id === teamMem.teamId) : null;
    const teamStr = team ? team.name + " (" + team.code + ")" : "-";
    out += `[${String(idx + 1).padStart(3, "0")}] NIM: ${m.username} | Password: genius2026 | Nama: ${m.fullName.padEnd(30, " ")} | Regu: ${teamStr.padEnd(20, " ")} | Prodi: ${m.prodi || "-"}\n`;
  });

  out += "\n================================================================================\n";
  out += "Catatan Penting:\n";
  out += "- Seluruh akun di atas telah aktif dan tersinkronisasi di database PostgreSQL.\n";
  out += "- Halaman login admin (http://localhost:3002/login) otomatis mendeteksi peran akun dan mengarahkan ke dashboard yang sesuai:\n";
  out += "  • ADMIN       ➔ /\n";
  out += "  • BUDDY       ➔ /buddy\n";
  out += "  • ORMAWA_PIC  ➔ /ormawa/portal\n";
  out += "- Akun Mahasiswa Baru (PARTICIPANT) ditolak di portal admin dan hanya diizinkan di aplikasi peserta (http://localhost:3000).\n";
  out += "================================================================================\n";

  const rootPath = path.resolve(__dirname, "../../user.txt");
  fs.writeFileSync(rootPath, out, "utf8");
  console.log("SUCCESS: user.txt written at", rootPath, "(Characters:", out.length, ")");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
