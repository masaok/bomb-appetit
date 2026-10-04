ALTER TABLE "users" ADD COLUMN "login" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "users_one_admin_idx" ON "users" USING btree ("role") WHERE "users"."role" = 'admin';