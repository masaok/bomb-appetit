DROP INDEX "runs_leaderboard_idx";--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "board_epoch" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "expert_names" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "team_size" integer GENERATED ALWAYS AS (1 + cardinality(expert_ids)) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "board_epoch" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "review" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ranked" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "runs_board_idx" ON "runs" USING btree ("mission_id","board_epoch","time_remaining_ms" DESC NULLS LAST,"strikes","created_at") WHERE "runs"."verified" and "runs"."result" = 'defused';--> statement-breakpoint
-- Expert names used to live only in room_players, which goes when the room is cleaned up.
-- Recover what can still be recovered: the room's roster first, then the account or guest name.
UPDATE "runs" r SET "expert_names" = ARRAY(
  SELECT coalesce(rp."display_name", u."name", g."display_name", 'Expert')
  FROM unnest(r."expert_ids") WITH ORDINALITY AS e(id, n)
  LEFT JOIN "room_players" rp ON rp."room_id" = r."room_id" AND rp."player_id" = e.id
  LEFT JOIN "users" u ON u."id" = e.id
  LEFT JOIN "guests" g ON g."id" = e.id
  ORDER BY e.n
) WHERE cardinality(r."expert_ids") > 0;
