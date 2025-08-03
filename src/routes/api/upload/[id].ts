import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { createId } from "@paralleldrive/cuid2";
import { revalidate } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";
import Busboy from "busboy";
import { eq } from "drizzle-orm";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { db, s3 } from "~/db";
import { events, images } from "~/db/schema";
import {
  downsizeVideo,
  generateThumbnail,
  grabFrame,
} from "~/lib/createVideoThumbnail";
import { teeReadable } from "~/lib/teeReadable";
import { getEvent } from "~/server/getEvent";

const playOverlay = readFile(
  path.join(process.cwd(), "public", "play-overlay.png"),
);

export const uploadLimiter = new RateLimiterMemory({
  points: 100, // 20 requests of the same user
  duration: 300, // per 300 seconds (5 minutes)
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 10MB

export async function POST({ request, params }: APIEvent) {
  const eventId = params.id;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) {
    return new Response(JSON.stringify({ error: new Error("No such event") }), {
      status: 400,
    });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response("Expected multipart form data", { status: 400 });
  }

  const body = request.body;
  if (!body) {
    return new Response(JSON.stringify({ error: new Error("No body") }), {
      status: 400,
    });
  }

  const nodeStream = Readable.from(body);

  return await new Promise<Response>((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(request.headers),
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    });
    let fileTruncated = false;

    busboy.on("error", (error) =>
      reject(new Response(JSON.stringify({ error }), { status: 500 })),
    );

    busboy.on("file", async (_name, file, info) => {
      const { filename, mimeType } = info;

      try {
        const id = createId();
        const isVideo = mimeType.startsWith("video/");

        file.on("limit", (error) => {
          fileTruncated = true;
          file.resume();
        });

        file.on("end", () => {
          if (fileTruncated) {
            reject(
              new Response(
                JSON.stringify({ error: new Error("{errors.fileTooLarge}") }),
                { status: 413 },
              ),
            );
          }
        });

        if (!(await s3.bucketExists(process.env.S3_BUCKET!))) {
          await s3.makeBucket(
            process.env.S3_BUCKET!,
            process.env.S3_REGION || undefined,
          );
        }

        if (isVideo) {
          const readables = teeReadable(file, 2);

          const [frameBytes, downsizedVideo] = await Promise.all([
            grabFrame(readables[0]),
            downsizeVideo(readables[1]),
          ]);

          const thumbnail = await generateThumbnail(
            frameBytes,
            mimeType,
            128,
            128,
            await playOverlay,
          );
          const preview = await generateThumbnail(
            frameBytes,
            mimeType,
            720,
            720 / (16 / 9),
          );

          const fileStream = createReadStream(downsizedVideo.path);
          await Promise.all([
            await s3.putObject(
              process.env.S3_BUCKET!,
              id,
              fileStream,
              undefined,
              {
                "Content-Type": "video/mp4",
              },
            ),
            await s3.putObject(
              process.env.S3_BUCKET!,
              `${id}_thumb`,
              thumbnail,
              undefined,
              {
                "Content-Type": "image/jpg",
              },
            ),
            await s3.putObject(
              process.env.S3_BUCKET!,
              `${id}_preview`,
              preview,
              undefined,
              {
                "Content-Type": "image/jpg",
              },
            ),
          ]);

          fileStream.close();
          await downsizedVideo.cleanup();
        } else {
          const imageBytes = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];

            file.on("data", (chunk) => {
              chunks.push(chunk);
            });

            file.on("end", async () => {
              const buffer = Buffer.concat(chunks); // Node Buffer

              resolve(buffer);
            });

            file.on("error", reject);
          });

          const thumbnail = await generateThumbnail(
            imageBytes,
            mimeType,
            128,
            128,
          );
          const preview = await generateThumbnail(
            imageBytes,
            mimeType,
            720,
            720 / (16 / 9),
          );

          await Promise.all([
            s3.putObject(process.env.S3_BUCKET!, id, imageBytes, undefined, {
              "Content-Type": mimeType,
            }),
            s3.putObject(
              process.env.S3_BUCKET!,
              `${id}_thumb`,
              thumbnail,
              undefined,
              {
                "Content-Type": mimeType,
              },
            ),
            await s3.putObject(
              process.env.S3_BUCKET!,
              `${id}_preview`,
              preview,
              undefined,
              {
                "Content-Type": mimeType,
              },
            ),
          ]);
        }

        const image = (
          await db
            .insert(images)
            .values({
              id,
              fileName: filename,
              mimeType,
              eventId,
            })
            .onConflictDoNothing()
            .returning()
        )[0];

        revalidate(getEvent.key);

        resolve(new Response(JSON.stringify({ image })));
      } catch (err) {
        console.error("MinIO upload failed:", err);
        reject(new Response(JSON.stringify({ error: err }), { status: 500 }));
      }
    });

    nodeStream.pipe(busboy);
  });
}
