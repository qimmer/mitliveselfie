import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "minio";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema,
  logger: {
    logQuery(query, params) {
      console.log(
        `\x1b[41m DB QUERY \x1b[0m \x1b[34m ${query}\x1b[0m\n`,
        params,
      );
    },
  },
});

export const s3 = new Client({
  endPoint: process.env.S3_ENDPOINT ?? "",
  port: process.env.S3_PORT ? Number.parseInt(process.env.S3_PORT) : undefined,
  useSSL: process.env.S3_SSL === "true",
  accessKey: process.env.S3_ACCESS_KEY ?? "",
  secretKey: process.env.S3_SECRET_KEY ?? "",
  region: process.env.S3_REGION || undefined,
});
