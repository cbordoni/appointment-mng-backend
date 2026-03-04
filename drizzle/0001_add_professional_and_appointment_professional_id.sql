CREATE TABLE "professionals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tax_id" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "professionals_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "professional_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_email_unique";
--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "email";
