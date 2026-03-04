import { t } from "elysia";

export const CreateAppointmentOverrideSchema = t.Object({
	appointmentId: t.String({ format: "uuid" }),
	recurrenceId: t.String({ format: "date-time" }),
	summary: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	description: t.Optional(t.Nullable(t.String())),
	dtstart: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	dtend: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	status: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	professionalId: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
	sequence: t.Optional(t.Number({ minimum: 0 })),
	dtstamp: t.Optional(t.String({ format: "date-time" })),
});

export const UpdateAppointmentOverrideSchema = t.Object({
	appointmentId: t.Optional(t.String({ format: "uuid" })),
	recurrenceId: t.Optional(t.String({ format: "date-time" })),
	summary: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	description: t.Optional(t.Nullable(t.String())),
	dtstart: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	dtend: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
	status: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	professionalId: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
	sequence: t.Optional(t.Number({ minimum: 0 })),
	dtstamp: t.Optional(t.String({ format: "date-time" })),
});

export const AppointmentOverrideIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateAppointmentOverrideInput =
	typeof CreateAppointmentOverrideSchema.static;
export type UpdateAppointmentOverrideInput =
	typeof UpdateAppointmentOverrideSchema.static;

export type AppointmentOverrideReplaceInput = {
	recurrenceId: Date;
	summary: string | null;
	description: string | null;
	dtstart: Date | null;
	dtend: Date | null;
	status: string | null;
	professionalId: string | null;
	sequence: number;
	dtstamp: Date;
};
