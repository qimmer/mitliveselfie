import type { APIEvent } from "@solidjs/start/server";
import { eq } from "drizzle-orm";
import { db, s3 } from "~/db";
import { images } from "~/db/schema";

const handler = async (event: APIEvent) => {
  "use server";
  const id = event.params.id;
  const { mimeType, fileName } = (await db.query.images.findFirst({
    where: eq(images.id, id),
  })) ?? { mimeType: undefined, fileName: undefined };
  const imageStream = await s3.getObject(
    process.env.S3_BUCKET ?? "",
    `${id}_thumb`,
  );

  if (!imageStream.readable || !fileName || !mimeType) {
    throw new Error("errors.notFound");
  }

  const reader = imageStream[Symbol.asyncIterator]();

  const webStream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    cancel(reason) {
      if (imageStream.destroy) imageStream.destroy(reason);
    },
  });

  return new Response(webStream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": mimeType.startsWith("video/") ? "image/jpg" : mimeType,
    },
  });
};

export const GET = handler;
