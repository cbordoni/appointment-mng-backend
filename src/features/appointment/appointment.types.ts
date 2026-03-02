import { t } from "elysia";

import type {
	Appointment,
	AppointmentEvent,
	AppointmentRecurrence,
} from "@/db/schema";

export const RecurrenceSchema = t.Union([
	t.Literal("none"),
	t.Literal("weekly"),
	t.Literal("monthly"),
]);

export const AppointmentEventStatusSchema = t.Union([
	t.Literal("completed"),
	t.Literal("cancelled"),
	t.Literal("rescheduled"),
]);

export type AppointmentEventStatus = typeof AppointmentEventStatusSchema.static;

export type AppointmentWithUser = Omit<Appointment, "userId"> & {
	userName: string;
};

export type AppointmentProjection = {
	sourceAppointmentId: string;
	title: string;
	startDate: Date;
	endDate: Date;
	observation: string | null;
	recurrence: AppointmentRecurrence;
	userName: string;
};

export const DateRangeQuerySchema = t.Object({
	from: t.Optional(t.String({ format: "date-time" })),
	to: t.Optional(t.String({ format: "date-time" })),
});

export type DateRangeQuery = typeof DateRangeQuerySchema.static;

export const CreateAppointmentSchema = t.Object({
	title: t.String({ minLength: 1 }),
	startDate: t.String({ format: "date-time" }),
	endDate: t.String({ format: "date-time" }),
	recurrence: t.Optional(RecurrenceSchema),
	active: t.Optional(t.Boolean()),
	observation: t.Optional(t.String()),
	userId: t.String({ format: "uuid" }),
});

export const UpdateAppointmentSchema = t.Object({
	title: t.Optional(t.String({ minLength: 1 })),
	startDate: t.Optional(t.String({ format: "date-time" })),
	endDate: t.Optional(t.String({ format: "date-time" })),
	recurrence: t.Optional(RecurrenceSchema),
	active: t.Optional(t.Boolean()),
	observation: t.Optional(t.Nullable(t.String())),
});

export const CreateAppointmentEventSchema = t.Object({
	status: AppointmentEventStatusSchema,
	summary: t.Optional(t.Nullable(t.String())),
	actualStartDate: t.Optional(t.String({ format: "date-time" })),
	actualEndDate: t.Optional(t.String({ format: "date-time" })),
	performedByUserId: t.Optional(t.String({ format: "uuid" })),
	newAppointmentId: t.Optional(t.String({ format: "uuid" })),
});

export const AppointmentHistoryQuerySchema = t.Object({
	appointmentId: t.String({ format: "uuid" }),
});

export const AppointmentIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateAppointmentInput = typeof CreateAppointmentSchema.static;
export type UpdateAppointmentInput = typeof UpdateAppointmentSchema.static;
export type AppointmentIdInput = typeof AppointmentIdSchema.static;
export type CreateAppointmentEventInput =
	typeof CreateAppointmentEventSchema.static;
export type AppointmentHistoryQueryInput =
	typeof AppointmentHistoryQuerySchema.static;

export type AppointmentEventWithSource = AppointmentEvent;
