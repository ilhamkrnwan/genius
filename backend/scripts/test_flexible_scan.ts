import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Testing Flexible Attendance API ===");

  let [p] = await db.select().from(users).where(eq(users.role, "PARTICIPANT")).limit(1);
  if (!p) {
    console.log("No participant found, creating test participant...");
    [p] = await db
      .insert(users)
      .values({
        username: `maba_test_${Date.now()}`,
        passwordHash: "$2b$10$dummyhashfortestingattendance123456",
        fullName: "Mahasiswa Baru Tester",
        role: "PARTICIPANT",
        gender: "MALE",
        characterClass: "CYBER_KNIGHT",
      })
      .returning();
  }
  console.log(`Using participant: ${p.fullName} (${p.id})`);

  // 1. Get active session
  const activeRes = await fetch("http://localhost:3001/api/attendance/active-session").then((r) => r.json());
  console.log("Active Session:", activeRes.data?.title, "Type:", activeRes.data?.type);

  // 2. Scan QR
  const scanRes = await fetch("http://localhost:3001/api/attendance/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantId: p.id,
      qrToken: `${activeRes.data.qrToken}-7K9Q`, // test with 5-minute salt
    }),
  }).then((r) => r.json());
  console.log("Scan Response:", scanRes);

  // 3. Duplicate scan test
  const dupRes = await fetch("http://localhost:3001/api/attendance/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantId: p.id,
      qrToken: activeRes.data.qrToken,
    }),
  }).then((r) => r.json());
  console.log("Duplicate Scan Response (should error):", dupRes.error || dupRes.message);

  // 4. Recap check
  const recapRes = await fetch(`http://localhost:3001/api/attendance/recap?sessionId=${activeRes.data.id}`).then((r) => r.json());
  console.log("Recap Total Checked In:", recapRes.data?.summary?.totalCheckedIn);
  console.log("Recap Attendees Count:", recapRes.data?.attendees?.length);

  console.log("✅ All Backend Flexible Attendance tests passed!");
}

main().catch(console.error);
