import { t } from "elysia";

export const CreateAppointmentExceptionSchema = t.Object({
	appointmentId: t.String({ format: "uuid" }),
	exdate: t.String({ format: "date-time" }),
});

export const UpdateAppointmentExceptionSchema = t.Object({
	appointmentId: t.Optional(t.String({ format: "uuid" })),
	exdate: t.Optional(t.String({ format: "date-time" })),
});

export const AppointmentExceptionIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateAppointmentExceptionInput =
	typeof CreateAppointmentExceptionSchema.static;
export type UpdateAppointmentExceptionInput =
	typeof UpdateAppointmentExceptionSchema.static;
