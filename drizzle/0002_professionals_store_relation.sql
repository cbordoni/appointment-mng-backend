ALTER TABLE "professionals" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
