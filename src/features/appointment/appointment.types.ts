import { t } from "elysia";

import type { Appointment } from "@/db/schema";

export type AppointmentWithUser = Omit<Appointment, "userId"> & {
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
	observation: t.Optional(t.String()),
	userId: t.String({ format: "uuid" }),
});

export const UpdateAppointmentSchema = t.Object({
	title: t.Optional(t.String({ minLength: 1 })),
	startDate: t.Optional(t.String({ format: "date-time" })),
	endDate: t.Optional(t.String({ format: "date-time" })),
	observation: t.Optional(t.Nullable(t.String())),
});

export const AppointmentIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateAppointmentInput = typeof CreateAppointmentSchema.static;
export type UpdateAppointmentInput = typeof UpdateAppointmentSchema.static;
export type AppointmentIdInput = typeof AppointmentIdSchema.static;
