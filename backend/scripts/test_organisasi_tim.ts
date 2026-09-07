import { db } from "../src/db";
import { users, teams, teamMembers, scoreTransactions, attendances } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "../src/lib/jwt";

const BASE_URL = "http://localhost:3001";

interface TestResult {
  module: string;
  action: string;
  endpoint: string;
  method: string;
  status: "PASSED" | "FAILED";
  httpCode: number;
  message?: string;
}

const results: TestResult[] = [];

async function record(module: string, action: string, method: string, endpoint: string, res: Response, expectedOk: boolean = true) {
  let json: any = null;
  try {
    json = await res.json();
  } catch (e) {
    // not json
  }

  const isOk = expectedOk ? res.ok && json?.success !== false : res.status === 400 || res.status === 404;
  const status = isOk ? "PASSED" : "FAILED";

  results.push({
    module,
    action,
    endpoint,
    method,
    status,
    httpCode: res.status,
    message: json?.error?.message || json?.message || (res.ok ? "Success" : res.statusText),
  });

  const icon = isOk ? "✅" : "❌";
  console.log(`${icon} [${module}] ${action} (${method} ${endpoint}) -> HTTP ${res.status}`);
  if (!isOk) {
    console.error(`   Error details:`, json || res.statusText);
  }
  return json;
}

async function runTests() {
  console.log("================================================================================");
  console.log("🚀 TESTING SELURUH ACTION & API MENU ORGANISASI TIM (PORT 3001)");
  console.log("================================================================================\n");

  // 1. Get Admin User & Sign JWT Token
  const [adminUser] = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);
  if (!adminUser) {
    console.error("Admin user not found in database!");
    process.exit(1);
  }

  const adminToken = await signToken({
    userId: adminUser.id,
    username: adminUser.username,
    role: "ADMIN",
    fullName: adminUser.fullName,
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  };

  console.log(`🔑 Authenticated as Admin: ${adminUser.username} (${adminUser.id})\n`);

  // ============================================================================
  // A. MODUL 1: PRESENSI HARIAN (/attendance)
  // ============================================================================
  console.log("--- [MODUL 1: PRESENSI HARIAN] ---");

  // 1. Load Daily Attendance Recap
  const resAttDaily = await fetch(`${BASE_URL}/api/attendance/recap?day=1`, { headers });
  await record("Presensi Harian", "Load Data Presensi Hari 1", "GET", "/api/attendance/recap?day=1", resAttDaily);

  // Create a temporary participant for attendance tests
  const tempMabaRes = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      username: `test_att_maba_${Date.now()}`,
      fullName: "Test Maba Presensi",
      role: "PARTICIPANT",
    }),
  });
  const tempMaba = await tempMabaRes.json();
  const testParticipantId = tempMaba?.data?.id;

  if (testParticipantId) {
    // 2. Batch Check-In
    const resBatchIn = await fetch(`${BASE_URL}/api/attendance/batch-check-in`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        participantIds: [testParticipantId],
        day: 1,
        status: "ON_TIME",
      }),
    });
    await record("Presensi Harian", "Batch Check-In Hadir", "POST", "/api/attendance/batch-check-in", resBatchIn);

    // 3. Batch Check-Out
    const resBatchOut = await fetch(`${BASE_URL}/api/attendance/batch-check-out`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        participantIds: [testParticipantId],
        day: 1,
      }),
    });
    await record("Presensi Harian", "Batch Check-Out", "POST", "/api/attendance/batch-check-out", resBatchOut);

    // 4. Batch Reset
    const resBatchReset = await fetch(`${BASE_URL}/api/attendance/batch-reset`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        participantIds: [testParticipantId],
        day: 1,
      }),
    });
    await record("Presensi Harian", "Batch Reset Presensi", "POST", "/api/attendance/batch-reset", resBatchReset);

    // 5. Gate QR Check-in
    const resGateIn = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        participantId: testParticipantId,
        day: 1,
        qrToken: "QR-PRESENSI-H1-GATE-UTAMA",
      }),
    });
    await record("Presensi Harian", "Scan QR Gate Check-In", "POST", "/api/attendance/check-in", resGateIn);
  }
  console.log("");

  // ============================================================================
  // B. MODUL 2: TEAM (/teams)
  // ============================================================================
  console.log("--- [MODUL 2: TEAM / REGU] ---");

  // 1. List Teams
  const resTeamList = await fetch(`${BASE_URL}/api/teams`, { headers });
  await record("Team", "List Semua Tim", "GET", "/api/teams", resTeamList);

  // 2. Create Team
  const teamCode = `TEST-${Date.now().toString().slice(-4)}`;
  const resCreateTeam = await fetch(`${BASE_URL}/api/teams`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: `Regu Uji Coba ${teamCode}`,
      code: teamCode,
    }),
  });
  const createdTeamJson = await record("Team", "Tambah Tim Baru", "POST", "/api/teams", resCreateTeam);
  const testTeamId = createdTeamJson?.data?.id;

  if (testTeamId) {
    // 3. Get Single Team Detail
    const resGetTeam = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, { headers });
    await record("Team", "Detail Tim", "GET", `/api/teams/${testTeamId}`, resGetTeam);

    // 4. Edit Team
    const resEditTeam = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name: `Regu Uji Coba Diperbarui ${teamCode}`,
      }),
    });
    await record("Team", "Edit Tim", "PUT", `/api/teams/${testTeamId}`, resEditTeam);

    // 5. Add Member to Team
    if (testParticipantId) {
      const resAddMember = await fetch(`${BASE_URL}/api/teams/${testTeamId}/members`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: testParticipantId,
        }),
      });
      await record("Team", "Tambah Anggota Tim", "POST", `/api/teams/${testTeamId}/members`, resAddMember);

      // 6. Set Captain
      const resSetCaptain = await fetch(`${BASE_URL}/api/teams/${testTeamId}/captain`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          captainId: testParticipantId,
        }),
      });
      await record("Team", "Tetapkan Ketua Tim", "POST", `/api/teams/${testTeamId}/captain`, resSetCaptain);

      // 7. Remove Member from Team
      const resRemMember = await fetch(`${BASE_URL}/api/teams/${testTeamId}/members/${testParticipantId}`, {
        method: "DELETE",
        headers,
      });
      await record("Team", "Keluarkan Anggota Tim", "DELETE", `/api/teams/${testTeamId}/members/${testParticipantId}`, resRemMember);
    }

    // 8. Batch Status Teams
    const resTeamStatus = await fetch(`${BASE_URL}/api/teams/batch-status`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        teamIds: [testTeamId],
        status: "ACTIVE",
      }),
    });
    await record("Team", "Batch Update Status Tim", "POST", "/api/teams/batch-status", resTeamStatus);

    // 9. Single Delete Team (with cascade)
    const resDelTeam = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, {
      method: "DELETE",
      headers,
    });
    await record("Team", "Hapus Tim (Single Cascade)", "DELETE", `/api/teams/${testTeamId}`, resDelTeam);

    // 10. Batch Delete Teams
    const resCreateTeam2 = await fetch(`${BASE_URL}/api/teams`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `Regu Batch Del ${teamCode}`,
        code: `BDEL-${Date.now().toString().slice(-4)}`,
      }),
    });
    const team2Json = await resCreateTeam2.json();
    if (team2Json?.data?.id) {
      const resBatchDelTeam = await fetch(`${BASE_URL}/api/teams/batch-delete`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          teamIds: [team2Json.data.id],
        }),
      });
      await record("Team", "Hapus Tim (Batch Cascade)", "POST", "/api/teams/batch-delete", resBatchDelTeam);
    }
  }
  console.log("");

  // ============================================================================
  // C. MODUL 3: PESERTA (/participants)
  // ============================================================================
  console.log("--- [MODUL 3: PESERTA] ---");

  // 1. List Participants
  const resPesertaList = await fetch(`${BASE_URL}/api/users?role=PARTICIPANT&page=1&pageSize=10`, { headers });
  await record("Peserta", "List Peserta", "GET", "/api/users?role=PARTICIPANT", resPesertaList);

  // 2. Create Participant
  const testMabaUname = `maba_test_${Date.now()}`;
  const resCreatePeserta = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      username: testMabaUname,
      fullName: "Maba Uji Coba Antigravity",
      role: "PARTICIPANT",
      gender: "MALE",
      characterClass: "TECH_MAGE",
      characterTitle: "Inisiator Muda",
      characterTier: 1,
    }),
  });
  const createdPesertaJson = await record("Peserta", "Tambah Peserta Baru", "POST", "/api/users", resCreatePeserta);
  const mabaId = createdPesertaJson?.data?.id;

  if (mabaId) {
    // 3. Edit Participant
    const resEditPeserta = await fetch(`${BASE_URL}/api/users/${mabaId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        fullName: "Maba Uji Coba Diperbarui",
        characterTitle: "Penjelajah Ahli",
        characterTier: 2,
      }),
    });
    await record("Peserta", "Edit Profil Peserta", "PUT", `/api/users/${mabaId}`, resEditPeserta);

    // 4. Award Title
    const resAwardTitle = await fetch(`${BASE_URL}/api/users/${mabaId}/award-title`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Penakluk 9 Lantai",
        upgradeTier: 3,
      }),
    });
    await record("Peserta", "Sematkan Gelar RPG", "POST", `/api/users/${mabaId}/award-title`, resAwardTitle);

    // 5. Reset Password Single
    const resResetPwd = await fetch(`${BASE_URL}/api/users/${mabaId}/reset-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ password: "passwordBaru123" }),
    });
    await record("Peserta", "Reset Password Peserta", "POST", `/api/users/${mabaId}/reset-password`, resResetPwd);

    // 6. Batch Reset Password
    const resBatchPwd = await fetch(`${BASE_URL}/api/users/batch-reset-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userIds: [mabaId],
        password: "genius2026",
      }),
    });
    await record("Peserta", "Batch Reset Password", "POST", "/api/users/batch-reset-password", resBatchPwd);

    // 7. Batch Assign Team & Unassign Team
    const [existingTeam] = await db.select().from(teams).limit(1);
    if (existingTeam) {
      const resAssignTeam = await fetch(`${BASE_URL}/api/users/batch-assign-team`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userIds: [mabaId],
          teamId: existingTeam.id,
        }),
      });
      await record("Peserta", "Batch Assign ke Tim", "POST", "/api/users/batch-assign-team", resAssignTeam);

      const resUnassignTeam = await fetch(`${BASE_URL}/api/users/batch-assign-team`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userIds: [mabaId],
          teamId: null,
        }),
      });
      await record("Peserta", "Batch Lepas dari Tim", "POST", "/api/users/batch-assign-team", resUnassignTeam);
    }

    // 8. Bulk Import CSV
    const resBulkImport = await fetch(`${BASE_URL}/api/users/bulk-import`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: [
          {
            username: `import_maba_${Date.now()}_1`,
            fullName: "Maba Impor Satu",
            role: "PARTICIPANT",
            gender: "FEMALE",
            characterClass: "DATA_DRUID",
          },
          {
            username: `import_maba_${Date.now()}_2`,
            fullName: "Maba Impor Dua",
            role: "PARTICIPANT",
            gender: "MALE",
            characterClass: "CYBER_KNIGHT",
          },
        ],
        defaultPassword: "genius2026",
        defaultRole: "PARTICIPANT",
      }),
    });
    await record("Peserta", "Bulk Import CSV Peserta", "POST", "/api/users/bulk-import", resBulkImport);

    // Add score transactions and attendance to mabaId to simulate the EXACT crash condition from user screenshot!
    console.log("   -> Menambahkan relasi score_transactions & attendance ke user uji untuk simulasi...");
    const [sampleTeam] = await db.select().from(teams).limit(1);
    await db.insert(scoreTransactions).values({
      participantId: mabaId,
      teamId: sampleTeam ? sampleTeam.id : mabaId,
      amount: 150,
      sourceType: "BONUS",
      reason: "Uji coba relasi skor",
    });
    await db.insert(attendances).values({
      participantId: mabaId,
      day: 1,
      date: "2026-09-22",
      checkInAt: new Date(),
    });

    // 9. Single Delete Peserta with RELATIONS (The bug reported by the user!)
    const resDeletePeserta = await fetch(`${BASE_URL}/api/users/${mabaId}`, {
      method: "DELETE",
      headers,
    });
    await record("Peserta", "Hapus Peserta Berelasi Skor (Fix 500)", "DELETE", `/api/users/${mabaId}`, resDeletePeserta);

    // 10. Batch Delete Peserta with Relations
    const tempMabaDelRes = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username: `batch_del_maba_${Date.now()}`,
        fullName: "Maba Batch Del",
        role: "PARTICIPANT",
      }),
    });
    const tempMabaDelJson = await tempMabaDelRes.json();
    if (tempMabaDelJson?.data?.id) {
      // Add score transaction
      await db.insert(scoreTransactions).values({
        participantId: tempMabaDelJson.data.id,
        teamId: sampleTeam ? sampleTeam.id : tempMabaDelJson.data.id,
        amount: 50,
        sourceType: "GAME",
        reason: "Test batch delete relation",
      });

      const resBatchDel = await fetch(`${BASE_URL}/api/users/batch-delete`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userIds: [tempMabaDelJson.data.id],
        }),
      });
      await record("Peserta", "Batch Delete Peserta Berelasi", "POST", "/api/users/batch-delete", resBatchDel);
    }
  }
  console.log("");

  // ============================================================================
  // D. MODUL 4: BUDDY (/buddies)
  // ============================================================================
  console.log("--- [MODUL 4: BUDDY] ---");

  // 1. List Buddies
  const resBuddyList = await fetch(`${BASE_URL}/api/users?role=BUDDY&page=1&pageSize=10`, { headers });
  await record("Buddy", "List Semua Buddy", "GET", "/api/users?role=BUDDY", resBuddyList);

  // 2. Create Buddy
  const testBuddyUname = `buddy_test_${Date.now()}`;
  const resCreateBuddy = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      username: testBuddyUname,
      fullName: "Buddy Pendamping Uji Coba",
      role: "BUDDY",
      gender: "FEMALE",
      characterClass: "DATA_DRUID",
    }),
  });
  const createdBuddyJson = await record("Buddy", "Tambah Buddy Baru", "POST", "/api/users", resCreateBuddy);
  const buddyId = createdBuddyJson?.data?.id;

  if (buddyId) {
    // 3. Edit Buddy
    const resEditBuddy = await fetch(`${BASE_URL}/api/users/${buddyId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        fullName: "Buddy Pendamping Diperbarui",
      }),
    });
    await record("Buddy", "Edit Data Buddy", "PUT", `/api/users/${buddyId}`, resEditBuddy);

    // 4. Assign Buddy to Team
    const [targetTeam] = await db.select().from(teams).limit(1);
    if (targetTeam) {
      const resAssignBuddy = await fetch(`${BASE_URL}/api/users/${buddyId}/assign-buddy`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          teamId: targetTeam.id,
          buddyRole: "PRIMARY",
        }),
      });
      await record("Buddy", "Plotting Regu Dampingan Buddy", "POST", `/api/users/${buddyId}/assign-buddy`, resAssignBuddy);
    }

    // 5. Batch Update Status Buddy
    const resBuddyStatus = await fetch(`${BASE_URL}/api/users/batch-status`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userIds: [buddyId],
        status: "INACTIVE",
      }),
    });
    await record("Buddy", "Batch Status Buddy (Nonaktif)", "POST", "/api/users/batch-status", resBuddyStatus);

    // 6. Delete Buddy Single (Cascade)
    const resDelBuddy = await fetch(`${BASE_URL}/api/users/${buddyId}`, {
      method: "DELETE",
      headers,
    });
    await record("Buddy", "Hapus Buddy (Single Cascade)", "DELETE", `/api/users/${buddyId}`, resDelBuddy);
  }
  console.log("");

  // ============================================================================
  // E. MODUL 5: PENGGUNA (/users)
  // ============================================================================
  console.log("--- [MODUL 5: PENGGUNA] ---");

  // 1. List All Users
  const resUsersList = await fetch(`${BASE_URL}/api/users?page=1&pageSize=10`, { headers });
  await record("Pengguna", "List Seluruh Pengguna", "GET", "/api/users", resUsersList);

  // 2. Create User (Panitia)
  const testUserUname = `panitia_test_${Date.now()}`;
  const resCreateUser = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      username: testUserUname,
      fullName: "Panitia Divisi Acara",
      role: "ADMIN",
    }),
  });
  const createdUserJson = await record("Pengguna", "Tambah Pengguna Baru", "POST", "/api/users", resCreateUser);
  const userId = createdUserJson?.data?.id;

  if (userId) {
    // 3. Edit User
    const resEditUser = await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        fullName: "Panitia Divisi Acara & Games",
      }),
    });
    await record("Pengguna", "Edit Profil Pengguna", "PUT", `/api/users/${userId}`, resEditUser);

    // 4. Reset Password
    const resUserResetPwd = await fetch(`${BASE_URL}/api/users/${userId}/reset-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ password: "passwordPanitia123" }),
    });
    await record("Pengguna", "Reset Password Pengguna", "POST", `/api/users/${userId}/reset-password`, resUserResetPwd);

    // 5. Batch Status
    const resUserBatchStatus = await fetch(`${BASE_URL}/api/users/batch-status`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userIds: [userId],
        status: "ACTIVE",
      }),
    });
    await record("Pengguna", "Batch Status Pengguna", "POST", "/api/users/batch-status", resUserBatchStatus);

    // 6. Delete User Single
    const resDelUser = await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers,
    });
    await record("Pengguna", "Hapus Pengguna (Single)", "DELETE", `/api/users/${userId}`, resDelUser);
  }

  // ============================================================================
  // F. UJI SPESIFIK USER DARI SCREENSHOT (ID: 4e559dfb-eee9-4ed9-b3e6-92c041fba9d1)
  // ============================================================================
  console.log("\n--- [UJI SPESIFIK: USER DARI SCREENSHOT] ---");
  const targetFailedUserId = "4e559dfb-eee9-4ed9-b3e6-92c041fba9d1";
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetFailedUserId)).limit(1);

  if (targetUser) {
    console.log(`Menghapus user spesifik yang sebelumnya gagal: ${targetUser.username} (${targetUser.id})...`);
    const resFixDel = await fetch(`${BASE_URL}/api/users/${targetFailedUserId}`, {
      method: "DELETE",
      headers,
    });
    await record("Verifikasi Bug", "Hapus User Screenshot (maba_simulasi_3day)", "DELETE", `/api/users/${targetFailedUserId}`, resFixDel);
  } else {
    console.log(`User ${targetFailedUserId} sudah tidak ada di database (sudah terhapus atau belum ada).`);
  }

  // Also clean up any orphan test users
  if (testParticipantId) {
    await fetch(`${BASE_URL}/api/users/${testParticipantId}`, { method: "DELETE", headers });
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n================================================================================");
  console.log("📊 RINGKASAN HASIL PENGUJIAN ACTION & API ORGANISASI TIM");
  console.log("================================================================================");

  const passedCount = results.filter((r) => r.status === "PASSED").length;
  const failedCount = results.filter((r) => r.status === "FAILED").length;

  console.table(
    results.map((r) => ({
      Modul: r.module,
      Action: r.action,
      Method: r.method,
      Endpoint: r.endpoint,
      HTTP: r.httpCode,
      Status: r.status,
    }))
  );

  console.log(`\nTOTAL PENGUJIAN : ${results.length}`);
  console.log(`BERHASIL (PASS) : ${passedCount} ✅`);
  console.log(`GAGAL (FAIL)    : ${failedCount} ${failedCount > 0 ? "❌" : "✨"}`);

  if (failedCount === 0) {
    console.log("\n🎉 SELURUH ACTION & API MENU ORGANISASI TIM LOLOS PENGUJIAN TANPA ERROR 500!");
  } else {
    console.log("\n⚠️ Terdapat pengujian yang gagal, mohon periksa tabel di atas.");
  }
}

runTests().catch(console.error);
