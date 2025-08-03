CREATE TABLE "drizzle"."events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"deletedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."images" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"eventId" varchar(64),
	"fileName" text NOT NULL,
	"mimeType" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drizzle"."images" ADD CONSTRAINT "images_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "drizzle"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_title_search_index" ON "drizzle"."events" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "events_deleted_null_idx" ON "drizzle"."events" USING btree ("id") WHERE "drizzle"."events"."deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "events_updated_at_idx" ON "drizzle"."events" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "images_created_at_idx" ON "drizzle"."images" USING btree ("createdAt");