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
  out += "Password   : KopDesMBG!2026\n";
  out += "Nama       : Administrator GENIUS 2026\n\n";

  out += "================================================================================\n";
  out += "2. AKUN GAME MASTER BUDDY (50 BUDDY — PENILAIAN FGD & PRESENSI REGU)\n";
  out += "================================================================================\n";
  out += "Role       : BUDDY\n";
  out += "Portal URL : http://localhost:3002/login ➔ /buddy\n";
  out += "Keterangan : Username menggunakan NIM, Password menggunakan nama kelompok (e.g. jabu01)\n\n";

  const buddies = allUsers.filter((u) => u.role === "BUDDY");
  // Sort buddies by assigned team code (GENIUS-01 s/d GENIUS-50)
  buddies.sort((a, b) => {
    const memA = allMembers.find((m) => m.userId === a.id);
    const teamA = memA ? allTeams.find((t) => t.id === memA.teamId) : null;
    const memB = allMembers.find((m) => m.userId === b.id);
    const teamB = memB ? allTeams.find((t) => t.id === memB.teamId) : null;
    return (teamA?.code || "").localeCompare(teamB?.code || "");
  });

  buddies.forEach((b, idx) => {
    const teamMem = allMembers.find((m) => m.userId === b.id);
    const team = teamMem ? allTeams.find((t) => t.id === teamMem.teamId) : null;
    const teamStr = team ? `${team.name} (${team.code})` : "Regu Pendamping";
    const padNum = team ? team.code.replace("GENIUS-", "").trim() : String(idx + 1).padStart(2, "0");
    const cleanHouseName = team ? team.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    const buddyPassword = `${cleanHouseName}${padNum}`;

    out += `[${idx + 1}] NIM/Username : ${b.username} | Password: ${buddyPassword}\n`;
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

  // Baca CSV maba_2026.csv untuk memetakan password tanggal lahir maba
  const csvPath = path.resolve(__dirname, "../../maba_2026.csv");
  const mabaPasswordMap = new Map<string, string>();
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const mabaLines = csvContent.trim().split(/\r?\n/).filter(Boolean);
    const headers = mabaLines[0].split(",").map((h) => h.replace(/["\r]/g, "").trim());
    const uIdx = headers.indexOf("username");
    const pwIdx = headers.indexOf("password_hash");
    for (const line of mabaLines.slice(1)) {
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
        c.replace(/^"|"$/g, "").trim()
      );
      const nim = cols[uIdx];
      const rawPw = cols[pwIdx] || "genius2026";
      const cleanPw = rawPw.toLowerCase().replace(/\s+/g, "");
      if (nim) {
        mabaPasswordMap.set(nim, cleanPw);
      }
    }
  }

  const mabas = allUsers.filter((u) => u.role === "PARTICIPANT").sort((a, b) => a.username.localeCompare(b.username));

  out += "================================================================================\n";
  out += `4. AKUN MAHASISWA BARU / PESERTA (${mabas.length} MABA RESMI)\n`;
  out += "================================================================================\n";
  out += "Role       : PARTICIPANT\n";
  out += "Portal URL : http://localhost:3000 (Aplikasi User Maba)\n";
  out += "Password   : Tanggal Lahir (Format: Huruf kecil & tanpa spasi, contoh: 26mei2006)\n\n";

  mabas.forEach((m, idx) => {
    const teamMem = allMembers.find((tm) => tm.userId === m.id);
    const team = teamMem ? allTeams.find((t) => t.id === teamMem.teamId) : null;
    const teamStr = team ? team.name + " (" + team.code + ")" : "-";
    const mabaPw = mabaPasswordMap.get(m.username) || "genius2026";
    out += `[${String(idx + 1).padStart(3, "0")}] NIM: ${m.username} | Password: ${mabaPw.padEnd(14, " ")} | Nama: ${m.fullName.padEnd(32, " ")} | Regu: ${teamStr.padEnd(20, " ")} | Prodi: ${m.prodi || "-"}\n`;
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
