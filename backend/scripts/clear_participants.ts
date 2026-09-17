import { db } from "../src/db";
import {
  users,
  teams,
  teamMembers,
  scoreTransactions,
  gameSessions,
  attendances,
  fgdEvaluations,
  dailyReflections,
  ormawaInterests,
  ormawaScans,
  participantAchievements,
  auditLogs,
} from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

async function clearParticipants() {
  console.log("🔍 Memeriksa data users dengan role PARTICIPANT...");

  const participants = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName })
    .from(users)
    .where(eq(users.role, "PARTICIPANT"));

  console.log(`📊 Ditemukan ${participants.length} user dengan role PARTICIPANT.`);

  if (participants.length === 0) {
    console.log("ℹ️ Tidak ada user role PARTICIPANT untuk dihapus.");
    process.exit(0);
  }

  const participantIds = participants.map((p) => p.id);

  console.log("🧹 Membersihkan referensi data partisipan pada tabel terkait...");

  // 1. Audit logs
  const deletedAudit = await db
    .delete(auditLogs)
    .where(inArray(auditLogs.actorId, participantIds))
    .returning({ id: auditLogs.id });
  console.log(`  - Dihapus ${deletedAudit.length} catatan auditLogs partisipan.`);

  // 2. Score transactions
  const deletedScores = await db
    .delete(scoreTransactions)
    .where(inArray(scoreTransactions.participantId, participantIds))
    .returning({ id: scoreTransactions.id });
  console.log(`  - Dihapus ${deletedScores.length} scoreTransactions partisipan.`);

  // 3. Reset captain di tabel teams jika kapten adalah partisipan yang dihapus
  const updatedCaptains = await db
    .update(teams)
    .set({ captainId: null })
    .where(inArray(teams.captainId, participantIds))
    .returning({ id: teams.id });
  console.log(`  - Di-reset captainId pada ${updatedCaptains.length} teams.`);

  // 5. Team members partisipan
  const deletedMembers = await db
    .delete(teamMembers)
    .where(inArray(teamMembers.userId, participantIds))
    .returning({ id: teamMembers.id });
  console.log(`  - Dihapus ${deletedMembers.length} record teamMembers partisipan.`);

  // 6. Attendances
  const deletedAtt = await db
    .delete(attendances)
    .where(inArray(attendances.participantId, participantIds))
    .returning({ id: attendances.id });
  console.log(`  - Dihapus ${deletedAtt.length} attendances partisipan.`);

  // 7. FGD evaluations
  const deletedFgd = await db
    .delete(fgdEvaluations)
    .where(inArray(fgdEvaluations.participantId, participantIds))
    .returning({ id: fgdEvaluations.id });
  console.log(`  - Dihapus ${deletedFgd.length} fgdEvaluations partisipan.`);

  // 8. Daily reflections
  const deletedReflections = await db
    .delete(dailyReflections)
    .where(inArray(dailyReflections.participantId, participantIds))
    .returning({ id: dailyReflections.id });
  console.log(`  - Dihapus ${deletedReflections.length} dailyReflections partisipan.`);

  // 9. Ormawa interests
  const deletedInterests = await db
    .delete(ormawaInterests)
    .where(inArray(ormawaInterests.participantId, participantIds))
    .returning({ id: ormawaInterests.id });
  console.log(`  - Dihapus ${deletedInterests.length} ormawaInterests partisipan.`);

  // 10. Ormawa scans
  const deletedScans = await db
    .delete(ormawaScans)
    .where(inArray(ormawaScans.participantId, participantIds))
    .returning({ id: ormawaScans.id });
  console.log(`  - Dihapus ${deletedScans.length} ormawaScans partisipan.`);

  // 11. Participant achievements
  const deletedAchievements = await db
    .delete(participantAchievements)
    .where(inArray(participantAchievements.participantId, participantIds))
    .returning({ id: participantAchievements.id });
  console.log(`  - Dihapus ${deletedAchievements.length} participantAchievements partisipan.`);

  // 12. Hapus seluruh users dengan role PARTICIPANT
  console.log("🗑️ Menghapus seluruh user role PARTICIPANT dari tabel users...");
  const deletedUsers = await db
    .delete(users)
    .where(eq(users.role, "PARTICIPANT"))
    .returning({ id: users.id, username: users.username });

  console.log(`✅ Berhasil menghapus ${deletedUsers.length} user role PARTICIPANT dari database.`);

  // Verifikasi akhir
  const remainingParticipants = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "PARTICIPANT"));
  const remainingTotal = await db.select({ id: users.id }).from(users);

  console.log(`\n📌 Status Akhir Tabel Users:`);
  console.log(`   - Sisa user PARTICIPANT: ${remainingParticipants.length}`);
  console.log(`   - Total sisa user (ADMIN, BUDDY, ORMAWA_PIC): ${remainingTotal.length}`);

  process.exit(0);
}

clearParticipants().catch((err) => {
  console.error("❌ Gagal membersihkan participants:", err);
  process.exit(1);
});
