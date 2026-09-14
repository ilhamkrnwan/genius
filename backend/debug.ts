import { db } from "./src/db";
import { games, missions, teams, gameSessions, teamMembers, users, locations } from "./src/db/schema";
import { GameEngine } from "./src/engine";
import { eq, and } from "drizzle-orm";

async function run() {
  try {
    // 1. Get a team
    const [team] = await db.select().from(teams).limit(1);
    // 2. Get a mission
    const [mission] = await db.select().from(missions).limit(1);
    
    if (!team || !mission) {
      console.log("Team or mission not found");
      return;
    }
    
    console.log("Team:", team.id, "Mission:", mission.id);

    const [game] = await db.select().from(games).where(eq(games.id, mission.gameId)).limit(1);
    console.log("Game:", game.type, game.config);

    console.log("Initializing payload...");
    const gamePayload = await GameEngine.initializeGamePayload(
      game.type,
      (game.config as Record<string, any>) || {},
      game.questionBankCategory
    );
    
    console.log("Payload:", gamePayload);

    // Fetch team participants
    const members = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        characterClass: users.characterClass,
        characterTier: users.characterTier,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(and(eq(teamMembers.teamId, team.id), eq(users.role, "PARTICIPANT")));

    console.log("Members:", members.length);

    console.log("Inserting session...");
    const [session] = await db
      .insert(gameSessions)
      .values({
        gameId: game.id,
        missionId: mission.id,
        teamId: team.id,
        locationId: mission.locationId,
        stageId: mission.stageId,
        buddyId: team.id, // Fake buddy id for testing
        status: "READY",
        timeLimit: mission.timeLimit || 300,
        participants: members,
        metadata: { gamePayload, initialStep: 1 },
      })
      .returning();
      
    console.log("Session inserted successfully:", session.id);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

run();
