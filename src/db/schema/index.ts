import {
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const stores = pgTable("stores", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	taxId: text("tax_id").unique(),
	email: text("email").notNull(),
	cellphone: text("cellphone").notNull(),
	deletedAt: timestamp("deleted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;

export const clients = pgTable("clients", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	taxId: text("tax_id"),
	cellphone: text("cellphone").notNull(),
	storeId: uuid("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	deletedAt: timestamp("deleted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export const professionals = pgTable("professionals", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	taxId: text("tax_id").notNull(),
	cellphone: text("cellphone").notNull(),
	storeId: uuid("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	deletedAt: timestamp("deleted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;
export type NewProfessional = typeof professionals.$inferInsert;

export const appointments = pgTable("appointments", {
	id: uuid("id").primaryKey().defaultRandom(),
	uid: text("uid").notNull().unique(),
	summary: text("summary").notNull(),
	description: text("description"),
	dtStart: timestamp("dtstart").notNull(),
	dtEnd: timestamp("dtend").notNull(),
	timezone: text("timezone").notNull().default("UTC"),
	rrule: text("rrule"),
	status: text("status").notNull().default("CONFIRMED"),
	sequence: integer("sequence").notNull().default(0),
	dtstamp: timestamp("dtstamp").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
	clientId: uuid("client_id")
		.notNull()
		.references(() => clients.id, { onDelete: "cascade" }),
	professionalId: uuid("professional_id")
		.notNull()
		.references(() => professionals.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointmentExdates = pgTable(
	"appointment_exdates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		appointmentId: uuid("appointment_id")
			.notNull()
			.references(() => appointments.id, { onDelete: "cascade" }),
		exdate: timestamp("exdate").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("appointment_exdates_appointment_exdate_unique").on(
			table.appointmentId,
			table.exdate,
		),
	],
);

export const appointmentOverrides = pgTable(
	"appointment_overrides",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		appointmentId: uuid("appointment_id")
			.notNull()
			.references(() => appointments.id, { onDelete: "cascade" }),
		recurrenceId: timestamp("recurrence_id").notNull(),
		summary: text("summary"),
		description: text("description"),
		dtstart: timestamp("dtstart"),
		dtend: timestamp("dtend"),
		status: text("status"),
		professionalId: uuid("professional_id").references(() => professionals.id, {
			onDelete: "set null",
		}),
		sequence: integer("sequence").notNull().default(0),
		dtstamp: timestamp("dtstamp").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("appointment_overrides_appointment_recurrence_unique").on(
			table.appointmentId,
			table.recurrenceId,
		),
	],
);

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type AppointmentExdate = typeof appointmentExdates.$inferSelect;
export type NewAppointmentExdate = typeof appointmentExdates.$inferInsert;
export type AppointmentOverride = typeof appointmentOverrides.$inferSelect;
export type NewAppointmentOverride = typeof appointmentOverrides.$inferInsert;
