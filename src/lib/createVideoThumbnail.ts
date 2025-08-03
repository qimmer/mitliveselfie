import type Stream from "node:stream";
import { Writable } from "node:stream";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import tmp from 'tmp-promise';

ffmpeg.setFfmpegPath(ffmpegStatic!);

function createUint8Collector(): [Writable, Promise<Buffer>] {
  const chunks: Buffer[] = [];
  let resolve: (buf: Buffer) => void;

  const done = new Promise<Buffer>((res) => {
    resolve = res;
  });

  const writable = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
    final(cb) {
      const combined = Buffer.concat(chunks);
      resolve(combined);
      cb();
    },
  });

  return [writable, done];
}

export async function downsizeVideo(input: Stream.Readable) {
  const { path, cleanup } = await tmp.file({ postfix: '.mp4' });

  const promise = new Promise<{ path: string, cleanup: () => void }>((resolve, reject) => {
    ffmpeg()
      .input(input)
      .duration("00:01:00")
      .videoFilters('scale=\'if(gt(a,16/9),1280,-2)\':\'if(gt(a,16/9),-2,720)\'')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputFormat("mp4")
      .outputOptions([
        '-preset faster',
        '-crf 26',               // adjust quality: 18 is high, 28 is lower (23 is default/good)
        '-movflags +faststart'   // enable streaming
      ])
      // The callback that is run when FFmpeg is finished
      .on("end", () => {
        console.log("FFmpeg has finished.");
        resolve({ path, cleanup });
      })

      // The callback that is run when FFmpeg encountered an error
      .on("error", (error) => {
        console.error(error);
        throw error;
      })
      .on("stderr", (line) => console.error(line))
      .saveToFile(path);
  });

  return promise;
}

export async function grabFrame(stream: Stream.Readable) {
  const [writable, uint8] = createUint8Collector();
  await ffmpeg()
    .input(stream)
    .seek(1)
    .frames(1)
    .noAudio()
    .outputFormat("mjpeg")
    // The callback that is run when FFmpeg is finished
    .on("end", () => {
      console.log("FFmpeg has finished.");
    })
    .on("stderr", (line) => console.error(line))
    // The callback that is run when FFmpeg encountered an error
    .on("error", (error) => {
      console.error(error);
    })
    .output(writable, { end: true })
    .run();

  return await uint8;
}

export async function generateThumbnail(
  bytes: Buffer,
  mimeType: string,
  width: number,
  height: number,
  overlay?: Buffer,
) {
  const image = await sharp(bytes)
    .resize(width, height, {
      fit: "cover",
      position: "center",
    })
    .composite(overlay ? [{ input: overlay, gravity: "center" }] : []);

  const outputBuffer = (
    mimeType.endsWith("/png") ? image.png() : image.jpeg({ quality: 85 })
  ).toBuffer();

  return outputBuffer;
}
