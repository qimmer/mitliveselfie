import { PassThrough } from "node:stream";

export function teeReadable(source: NodeJS.ReadableStream, count: number) {
  const targets = Array.from({ length: count }, () => new PassThrough());

  (async () => {
    try {
      for await (const chunk of source) {
        for (const target of targets) {
          target.write(chunk);
        }
      }
      for (const target of targets) {
        target.end();
      }
    } catch (err) {
      for (const target of targets) {
        target.destroy(err as Error);
      }
    }
  })();

  return targets;
}
