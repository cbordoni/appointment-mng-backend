import { t } from "elysia";

import type { Appointment } from "@/db/schema";

const EventStatusSchema = t.Union([
	t.Literal("TENTATIVE"),
	t.Literal("CONFIRMED"),
	t.Literal("CANCELLED"),
]);

export const AppointmentProjectionQuerySchema = t.Object({
	from: t.String({ format: "date-time" }),
	to: t.String({ format: "date-time" }),
});

export type AppointmentProjectionQuery =
	typeof AppointmentProjectionQuerySchema.static;

export type AppointmentProjectionRow = {
	appointment: Appointment & {
		clientName: string;
		professionalName: string;
	};
	exdates: Date[];
	overrides: {
		recurrenceId: Date;
		summary: string | null;
		description: string | null;
		dtstart: Date | null;
		dtend: Date | null;
		status: string | null;
		professionalId: string | null;
	}[];
};

export type AppointmentProjectionItem = {
	appointmentId: string;
	uid: string;
	clientId: string;
	clientName: string;
	professionalId: string;
	professionalName: string;
	summary: string;
	description: string | null;
	status: "TENTATIVE" | "CONFIRMED" | "CANCELLED";
	dtstart: Date;
	dtend: Date;
	timezone: string;
	recurrenceId: Date | null;
	source: "APPOINTMENT" | "OVERRIDE";
};

export const AppointmentProjectionItemSchema = t.Object({
	appointmentId: t.String({ format: "uuid" }),
	uid: t.String(),
	clientId: t.String({ format: "uuid" }),
	clientName: t.String(),
	professionalId: t.String({ format: "uuid" }),
	professionalName: t.String(),
	summary: t.String(),
	description: t.Nullable(t.String()),
	status: EventStatusSchema,
	dtstart: t.Date(),
	dtend: t.Date(),
	timezone: t.String(),
	recurrenceId: t.Nullable(t.Date()),
	source: t.Union([t.Literal("APPOINTMENT"), t.Literal("OVERRIDE")]),
});

export const AppointmentProjectionResponseSchema = t.Object({
	data: t.Array(AppointmentProjectionItemSchema),
});
