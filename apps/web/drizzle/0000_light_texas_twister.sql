CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_progress" (
	"player_id" uuid NOT NULL,
	"mission_id" text NOT NULL,
	"best_time_ms" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mission_progress_player_id_mission_id_pk" PRIMARY KEY("player_id","mission_id")
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"section" integer NOT NULL,
	"order" integer NOT NULL,
	"case_size" text NOT NULL,
	"time_limit_ms" integer NOT NULL,
	"strike_limit" integer NOT NULL,
	"module_pool" jsonb NOT NULL,
	"needy_pool" jsonb NOT NULL,
	"module_count" integer NOT NULL,
	"needy_count" integer DEFAULT 0 NOT NULL,
	"fixed_bomb_seed" bigint,
	"rule_seed" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_players" (
	"room_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"role" text NOT NULL,
	"display_name" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_players_room_id_player_id_pk" PRIMARY KEY("room_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" char(5) NOT NULL,
	"host_id" uuid NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"mission_id" text,
	"freeplay_config" jsonb,
	"bomb_seed" bigint NOT NULL,
	"rule_seed" integer DEFAULT 1 NOT NULL,
	"round_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone,
	"last_status" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"room_id" uuid,
	"mission_id" text,
	"defuser_id" uuid,
	"defuser_name" text NOT NULL,
	"expert_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"bomb_seed" bigint NOT NULL,
	"rule_seed" integer NOT NULL,
	"engine_version" text NOT NULL,
	"spec" jsonb NOT NULL,
	"result" text NOT NULL,
	"reason" text NOT NULL,
	"time_remaining_ms" integer NOT NULL,
	"strikes" integer NOT NULL,
	"action_log" jsonb NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "runs_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'player' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "room_players_one_defuser_idx" ON "room_players" USING btree ("room_id") WHERE "room_players"."role" = 'defuser';--> statement-breakpoint
CREATE INDEX "rooms_expires_at_idx" ON "rooms" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "runs_leaderboard_idx" ON "runs" USING btree ("mission_id","verified","time_remaining_ms" DESC NULLS LAST);