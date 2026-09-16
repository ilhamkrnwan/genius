import { db } from "../src/db";
import { users, ormawaBooths, ormawaScans } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "../src/lib/jwt";
import { ormawaRoutes } from "../src/routes/ormawa";
import { Elysia } from "elysia";

async function run() {
  console.log("=== Testing Ormawa Scanning Endpoints ===");

  // 1. Get Admin user
  const [adminUser] = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);
  if (!adminUser) throw new Error("No admin user found");
  const adminToken = await signToken({ userId: adminUser.id, role: adminUser.role, username: adminUser.username });

  // 2. Get Maba user
  const [mabaUser] = await db.select().from(users).where(eq(users.role, "PARTICIPANT")).limit(1);
  if (!mabaUser) throw new Error("No participant user found");
  const mabaToken = await signToken({ userId: mabaUser.id, role: mabaUser.role, username: mabaUser.username });

  // 3. Get an active booth
  const [booth] = await db.select().from(ormawaBooths).where(eq(ormawaBooths.isActive, true)).limit(1);
  if (!booth) throw new Error("No active booth found");

  console.log(`Using Admin: ${adminUser.username}, Maba: ${mabaUser.username} (${mabaUser.fullName}), Booth: ${booth.name} (${booth.code})`);

  // Clean up previous test scans for this maba & booth to test clean flow
  await db.delete(ormawaScans).where(eq(ormawaScans.participantId, mabaUser.id));

  const testApp = new Elysia().use(ormawaRoutes);

  // Test 1: GET /api/ormawa/my-booth as Admin
  console.log("\n[TEST 1] GET /api/ormawa/my-booth as Admin");
  const res1 = await testApp.handle(
    new Request("http://localhost/api/ormawa/my-booth", {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  );
  const data1 = await res1.json();
  console.log("Status:", res1.status);
  console.log("Response:", JSON.stringify(data1, null, 2));
  if (res1.status !== 200 || !data1.success || !data1.data?.allBooths) {
    throw new Error("Test 1 Failed: my-booth did not return allBooths for admin");
  }
  console.log("✓ TEST 1 PASSED");

  // Test 2: POST /api/ormawa/scan-maba as Admin with GENIUS-MABA- prefix
  console.log("\n[TEST 2] POST /api/ormawa/scan-maba with GENIUS-MABA- prefix");
  const qrPayload = `GENIUS-MABA-${mabaUser.username}`;
  const res2 = await testApp.handle(
    new Request("http://localhost/api/ormawa/scan-maba", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mabaNim: qrPayload,
        boothId: booth.id,
      }),
    })
  );
  const rawText2 = await res2.text();
  console.log("Status:", res2.status);
  console.log("Raw Response 2:", rawText2);
  let data2;
  try {
    data2 = JSON.parse(rawText2);
  } catch (e) {
    console.error("Failed to parse JSON:", rawText2);
    throw e;
  }
  if (res2.status !== 200 || !data2.success) {
    throw new Error("Test 2 Failed: scan-maba failed to parse or record scan");
  }
  console.log("✓ TEST 2 PASSED");

  // Test 3: POST /api/ormawa/scan-maba duplicate scan detection
  console.log("\n[TEST 3] Duplicate scan detection in scan-maba");
  const res3 = await testApp.handle(
    new Request("http://localhost/api/ormawa/scan-maba", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mabaNim: mabaUser.username,
        boothId: booth.id,
      }),
    })
  );
  const data3 = await res3.json();
  console.log("Status:", res3.status);
  console.log("Response:", JSON.stringify(data3, null, 2));
  if (data3.success !== false) {
    throw new Error("Test 3 Failed: duplicate scan was not prevented");
  }
  console.log("✓ TEST 3 PASSED");

  // Test 4: POST /api/ormawa/scan from Maba User scanning a different booth
  const otherBooths = await db.select().from(ormawaBooths).where(eq(ormawaBooths.isActive, true));
  const booth2 = otherBooths.find(b => b.id !== booth.id);
  if (booth2) {
    console.log(`\n[TEST 4] POST /api/ormawa/scan from Maba for booth ${booth2.name} (${booth2.qrCode})`);
    const res4 = await testApp.handle(
      new Request("http://localhost/api/ormawa/scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mabaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode: booth2.qrCode,
        }),
      })
    );
    const data4 = await res4.json();
    console.log("Status:", res4.status);
    console.log("Response:", JSON.stringify(data4, null, 2));
    if (res4.status !== 200 || !data4.success) {
      throw new Error("Test 4 Failed: Maba scan booth failed");
    }
    console.log("✓ TEST 4 PASSED");
  }

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
