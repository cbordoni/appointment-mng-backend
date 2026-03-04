ALTER TABLE "appointments" RENAME COLUMN "title" TO "summary";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "rrule" text;--> statement-breakpoint
UPDATE "appointments"
SET "rrule" = CASE
	WHEN "recurrence" = 'daily' THEN 'FREQ=DAILY'
	WHEN "recurrence" = 'weekly' THEN 'FREQ=WEEKLY'
	WHEN "recurrence" = 'monthly' THEN 'FREQ=MONTHLY'
	ELSE NULL
END;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "recurrence";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."appointment_recurrence";