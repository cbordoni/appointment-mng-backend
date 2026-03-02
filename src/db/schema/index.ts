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
	"weekly",
	"monthly",
]);

export const appointmentEventStatusEnum = pgEnum("appointment_event_status", [
	"completed",
	"cancelled",
	"rescheduled",
]);

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	cellphone: text("cellphone").notNull(),
	role: text("role")
		.notNull()
		.default("customer")
		.$type<"admin" | "customer">(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const appointments = pgTable("appointments", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date").notNull(),
	recurrence: recurrenceEnum("recurrence").notNull().default("none"),
	active: boolean("active").notNull().default(true),
	deletedAt: timestamp("deleted_at"),
	observation: text("observation"),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type AppointmentRecurrence = (typeof recurrenceEnum.enumValues)[number];

export const appointmentEvents = pgTable("appointment_events", {
	id: uuid("id").primaryKey().defaultRandom(),
	appointmentId: uuid("appointment_id")
		.notNull()
		.references(() => appointments.id, { onDelete: "cascade" }),
	status: appointmentEventStatusEnum("status").notNull(),
	summary: text("summary"),
	originalStartDate: timestamp("original_start_date").notNull(),
	originalEndDate: timestamp("original_end_date").notNull(),
	actualStartDate: timestamp("actual_start_date"),
	actualEndDate: timestamp("actual_end_date"),
	performedByUserId: uuid("performed_by_user_id").references(() => users.id, {
		onDelete: "set null",
	}),
	newAppointmentId: uuid("new_appointment_id").references(
		() => appointments.id,
		{
			onDelete: "set null",
		},
	),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppointmentEvent = typeof appointmentEvents.$inferSelect;
export type NewAppointmentEvent = typeof appointmentEvents.$inferInsert;
