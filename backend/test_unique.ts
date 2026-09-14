import { db } from "./src/db";
import { games, missions, teams, gameSessions, teamMembers, users, locations } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const [team] = await db.select().from(teams).limit(1);
    const [mission] = await db.select().from(missions).limit(1);
    const [game] = await db.select().from(games).where(eq(games.id, mission.gameId)).limit(1);
    const [admin] = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);

    console.log("Inserting first time...");
    await db.insert(gameSessions).values({
      gameId: game.id,
      missionId: mission.id,
      teamId: team.id,
      locationId: mission.locationId,
      stageId: mission.stageId,
      buddyId: admin.id,
      status: "READY",
    });
    console.log("First insert ok");

    console.log("Inserting second time...");
    await db.insert(gameSessions).values({
      gameId: game.id,
      missionId: mission.id,
      teamId: team.id,
      locationId: mission.locationId,
      stageId: mission.stageId,
      buddyId: admin.id,
      status: "READY",
    });
    console.log("Second insert ok");
  } catch (err: any) {
    console.log("Caught Error Keys:", Object.keys(err));
    console.log("Error Code:", err.code);
    console.log("Error Constraint:", err.constraint);
    console.log("Error Constraint_Name:", err.constraint_name);
    console.log("Full Error:", err);
  }
  process.exit(0);
}

run();
