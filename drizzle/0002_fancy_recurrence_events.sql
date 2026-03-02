CREATE TYPE "public"."appointment_recurrence" AS ENUM('none', 'weekly', 'monthly');
--> statement-breakpoint
CREATE TYPE "public"."appointment_event_status" AS ENUM('completed', 'cancelled', 'rescheduled');
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "recurrence" "appointment_recurrence" DEFAULT 'none' NOT NULL;
--> statement-breakpoint
CREATE TABLE "appointment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"status" "appointment_event_status" NOT NULL,
	"original_start_date" timestamp NOT NULL,
	"original_end_date" timestamp NOT NULL,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"performed_by_user_id" uuid,
	"new_appointment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_performed_by_user_id_users_id_fk" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_new_appointment_id_appointments_id_fk" FOREIGN KEY ("new_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;