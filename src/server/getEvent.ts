import { query } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { events } from "~/db/schema";

export const getEvent = query(async (id: string, w?: { images?: true }) => {
  "use server";

  return await db.query.events.findFirst({
    where: eq(events.id, id), with: {
      images: w?.images
    }
  });
}, "getEvent");
