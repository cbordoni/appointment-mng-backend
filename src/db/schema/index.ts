import {
	boolean,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const recurrenceEnum = pgEnum("appointment_recurrence", [
	"none",
	"daily",
	"weekly",
	"monthly",
]);

export const clients = pgTable("clients", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	taxId: text("tax_id").unique(),
	cellphone: text("cellphone").notNull(),
	deletedAt: timestamp("deleted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export const professionals = pgTable("professionals", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	taxId: text("tax_id").notNull().unique(),
	cellphone: text("cellphone").notNull(),
	deletedAt: timestamp("deleted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;
export type NewProfessional = typeof professionals.$inferInsert;

export const appointments = pgTable("appointments", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date").notNull(),
	recurrence: recurrenceEnum("recurrence").notNull().default("none"),
	active: boolean("active").notNull().default(true),
	deletedAt: timestamp("deleted_at"),
	observation: text("observation"),
	clientId: uuid("client_id")
		.notNull()
		.references(() => clients.id, { onDelete: "cascade" }),
	professionalId: uuid("professional_id")
		.notNull()
		.references(() => professionals.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
