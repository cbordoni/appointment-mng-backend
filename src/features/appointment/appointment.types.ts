import { t } from "elysia";

import type { Appointment } from "@/db/schema";

const RFC_5545_RRULE_PATTERN =
	"^(FREQ=(SECONDLY|MINUTELY|HOURLY|DAILY|WEEKLY|MONTHLY|YEARLY))(;([A-Z]+)=([^;\\s]+))*$";

const EventStatusSchema = t.Union([
	t.Literal("TENTATIVE"),
	t.Literal("CONFIRMED"),
	t.Literal("CANCELLED"),
]);

export type AppointmentWithClient = Appointment & {
	clientName: string;
	professionalName: string;
};

export const DateRangeQuerySchema = t.Object({
	from: t.Optional(t.String({ format: "date-time" })),
	to: t.Optional(t.String({ format: "date-time" })),
});

export type DateRangeQuery = typeof DateRangeQuerySchema.static;

export const CreateAppointmentSchema = t.Object({
	uid: t.Optional(t.String({ minLength: 1 })),
	summary: t.String({ minLength: 1 }),
	description: t.Optional(t.String()),
	dtstart: t.String({ format: "date-time" }),
	dtend: t.String({ format: "date-time" }),
	timezone: t.Optional(t.String({ minLength: 1 })),
	rrule: t.Optional(t.String({ pattern: RFC_5545_RRULE_PATTERN })),
	status: t.Optional(EventStatusSchema),
	sequence: t.Optional(t.Number({ minimum: 0 })),
	clientId: t.String({ format: "uuid" }),
	professionalId: t.String({ format: "uuid" }),
});

export const UpdateAppointmentSchema = t.Object({
	uid: t.Optional(t.String({ minLength: 1 })),
	summary: t.Optional(t.String({ minLength: 1 })),
	description: t.Optional(t.Nullable(t.String())),
	dtstart: t.Optional(t.String({ format: "date-time" })),
	dtend: t.Optional(t.String({ format: "date-time" })),
	timezone: t.Optional(t.String({ minLength: 1 })),
	rrule: t.Optional(t.Nullable(t.String({ pattern: RFC_5545_RRULE_PATTERN }))),
	status: t.Optional(EventStatusSchema),
	sequence: t.Optional(t.Number({ minimum: 0 })),
	professionalId: t.Optional(t.String({ format: "uuid" })),
});

export const AppointmentIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateAppointmentInput = typeof CreateAppointmentSchema.static;
export type UpdateAppointmentInput = typeof UpdateAppointmentSchema.static;
export type AppointmentIdInput = typeof AppointmentIdSchema.static;
