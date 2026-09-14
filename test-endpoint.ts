import { db } from "./backend/src/db";
import { gameSessions } from "./backend/src/db/schema";
import { eq } from "drizzle-orm";

async function test() {
  const [session] = await db.select().from(gameSessions).limit(1);
  if (!session) {
    console.log("No session found");
    process.exit(0);
  }
  console.log("Found session:", session.id, "Status:", session.status);
  
  const metadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
  console.log("Metadata before:", metadata);
  
  const currentIdx = typeof metadata.currentQuestionIndex === 'number' ? metadata.currentQuestionIndex : 0;
  
  const [updated] = await db
    .update(gameSessions)
    .set({
      metadata: { ...metadata, currentQuestionIndex: currentIdx + 1 },
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, session.id))
    .returning();
    
  console.log("Metadata after:", updated.metadata);
  process.exit(0);
}

test().catch(console.error);
