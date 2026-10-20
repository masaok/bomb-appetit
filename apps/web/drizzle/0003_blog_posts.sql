CREATE TABLE "posts" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"primary_keyword" text NOT NULL,
	"secondary_keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"length" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"author" text NOT NULL,
	"image" text,
	"body" text NOT NULL,
	"draft" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"seeded_hash" text,
	CONSTRAINT "posts_primary_keyword_unique" UNIQUE("primary_keyword")
);
--> statement-breakpoint
CREATE INDEX "posts_recent_idx" ON "posts" USING btree ("draft","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_updated_idx" ON "posts" USING btree ("draft","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category","draft","published_at" DESC NULLS LAST);