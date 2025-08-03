import { Writable } from 'node:stream';

export function bufferStream(): [Writable, Promise<Buffer>] {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _, cb) {
      chunks.push(chunk);
      cb();
    }
  });
  return [writable, new Promise((res) => writable.on('finish', () => res(Buffer.concat(chunks))))];
}
