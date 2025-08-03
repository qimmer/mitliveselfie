import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  index, pgSchema, text,
  timestamp, varchar
} from "drizzle-orm/pg-core";

const drizzleSchema = pgSchema("drizzle");

const foreignId = () => varchar({ length: 64 });
const id = () =>
  varchar({ length: 64 })
    .primaryKey()
    .$defaultFn(() => createId());

export const events = drizzleSchema.table(
  "events",
  {
    id: id(),
    title: text().notNull(),
    start: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    end: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    deletedAt: timestamp({ withTimezone: true, mode: "date" }),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("events_title_search_index").using(
      "gin",
      sql`to_tsvector('english', ${table.title})`,
    ),
    index("events_deleted_null_idx")
      .on(table.id)
      .where(sql`${table.deletedAt} IS NULL`),
    index("events_updated_at_idx").on(table.updatedAt),
  ],
);

export const images = drizzleSchema.table(
  "images",
  {
    id: id(),
    eventId: foreignId().references(() => events.id, {
      onDelete: "cascade",
    }),
    fileName: text().notNull(),
    mimeType: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("images_created_at_idx").on(table.createdAt)],
);

export const eventRelations = relations(events, ({ one, many }) => ({
  images: many(images, {
    relationName: "eventImages"
  }),
}));

export const imageRelations = relations(images, ({ one, many }) => ({
  image: one(events, {
    fields: [images.eventId],
    references: [events.id],
    relationName: "eventImages"
  }),
}));
