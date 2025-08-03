import { PassThrough, Readable } from "node:stream";
import type { APIEvent } from "@solidjs/start/server";
import archiver from "archiver";
import { eq } from "drizzle-orm";
import { db, s3 } from "~/db";
import { images } from "~/db/schema";

const handler = async (event: APIEvent) => {
  "use server";
  const eventId = event.params.id;
  const myImages = await db.query.images.findMany({
    where: eq(images.eventId, eventId),
    orderBy: (images, { desc }) => [desc(images.createdAt)],
  });

  const nodeStream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(nodeStream); // Pipe archiver output into PassThrough stream

  for (const image of myImages) {
    try {
      const imageStream = await s3.getObject(
        process.env.S3_BUCKET ?? "",
        image.id,
      );
      if (!imageStream.readable) continue;

      archive.append(imageStream, { name: image.fileName });
    } catch (err) {
      console.log(`Failed to fetch ${image.fileName}: ${err}`);
    }
  }

  archive.finalize();

  const webStream = Readable.toWeb(nodeStream);

  return new Response(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="pictures.zip"`,
    },
  });
};

export const GET = handler;
