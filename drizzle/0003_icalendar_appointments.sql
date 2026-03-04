ALTER TABLE "appointments" RENAME COLUMN "start_date" TO "dtstart";--> statement-breakpoint
ALTER TABLE "appointments" RENAME COLUMN "end_date" TO "dtend";--> statement-breakpoint
ALTER TABLE "appointments" RENAME COLUMN "observation" TO "description";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "uid" text;--> statement-breakpoint
UPDATE "appointments"
SET "uid" = "id"::text || '@appointment.local'
WHERE "uid" IS NULL;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "uid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_uid_unique" UNIQUE ("uid");--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "status" text DEFAULT 'CONFIRMED' NOT NULL;--> statement-breakpoint
UPDATE "appointments"
SET "status" = CASE
	WHEN "active" = true THEN 'CONFIRMED'
	ELSE 'CANCELLED'
END;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "dtstamp" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

CREATE TABLE "appointment_exdates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"exdate" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "appointment_exdates" ADD CONSTRAINT "appointment_exdates_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_exdates_appointment_exdate_unique" ON "appointment_exdates" USING btree ("appointment_id", "exdate");--> statement-breakpoint

CREATE TABLE "appointment_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"recurrence_id" timestamp NOT NULL,
	"summary" text,
	"description" text,
	"dtstart" timestamp,
	"dtend" timestamp,
	"status" text,
	"professional_id" uuid,
	"sequence" integer DEFAULT 0 NOT NULL,
	"dtstamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "appointment_overrides" ADD CONSTRAINT "appointment_overrides_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_overrides" ADD CONSTRAINT "appointment_overrides_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_overrides_appointment_recurrence_unique" ON "appointment_overrides" USING btree ("appointment_id", "recurrence_id");
